import mongoose from "mongoose";
import Group from "../models/group.model.js";
import Settlement from "../models/settlement.model.js";

// Get aggregated balances across all groups
export const getUserBalances = async (req, res, next) => {
    try {
        const userId = req.userId;

        // Find all groups where user is a member
        const groups = await Group.find({ members: userId })
            .populate("members", "name email avatarUrl")
            .select("-__v")
            .lean()
            .exec();

        // Aggregate balances from all groups
        const userBalanceMap = new Map();
        let totalBalance = 0;

        groups.forEach(group => {
            const balances = group.balances || {};

            // Add current user's balance
            const userGroupBalance = balances[userId] || 0;
            totalBalance += userGroupBalance;

            // Track balances with other users
            group.members.forEach(member => {
                const memberId = member._id.toString();
                if (memberId === userId) return;

                const memberBalance = balances[memberId] || 0;

                // Calculate net balance between user and this member
                if (!userBalanceMap.has(memberId)) {
                    userBalanceMap.set(memberId, {
                        user: member,
                        netBalance: 0
                    });
                }

                const current = userBalanceMap.get(memberId);

                // If user has positive balance and member has negative
                if (userGroupBalance > 0 && memberBalance < 0) {
                    const share = Math.min(Math.abs(userGroupBalance), Math.abs(memberBalance));
                    current.netBalance += share;
                }
                // If user has negative balance and member has positive
                else if (userGroupBalance < 0 && memberBalance > 0) {
                    const share = Math.min(Math.abs(userGroupBalance), Math.abs(memberBalance));
                    current.netBalance -= share;
                }
            });
        });

        // Convert to debts array
        const debts = [];
        let youAreOwed = 0;
        let youOwe = 0;

        userBalanceMap.forEach((value) => {
            if (value.netBalance !== 0) {
                const debt = {
                    user: value.user,
                    type: value.netBalance > 0 ? "owes_you" : "you_owe",
                    amount: parseFloat(Math.abs(value.netBalance).toFixed(2)),
                    isSettled: false
                };

                if (value.netBalance > 0) {
                    youAreOwed += Math.abs(value.netBalance);
                } else {
                    youOwe += Math.abs(value.netBalance);
                }

                debts.push(debt);
            }
        });

        // Sort debts: owes_you first, then by amount descending
        debts.sort((a, b) => {
            if (a.type === "owes_you" && b.type === "you_owe") return -1;
            if (a.type === "you_owe" && b.type === "owes_you") return 1;
            return b.amount - a.amount;
        });

        res.status(200).json({
            success: true,
            data: {
                totalBalance: parseFloat(totalBalance.toFixed(2)),
                youAreOwed: parseFloat(youAreOwed.toFixed(2)),
                youOwe: parseFloat(youOwe.toFixed(2)),
                debts
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create a settlement (record payment)
export const createSettlement = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { toUserId, amount, groupId, description } = req.body;
        const fromUserId = req.userId;

        if (!toUserId || !amount || !groupId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "toUserId, amount, and groupId are required"
            });
        }

        if (fromUserId === toUserId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Cannot settle with yourself"
            });
        }

        const group = await Group.findById(groupId).session(session);
        if (!group) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Verify both users are members
        if (!group.members.some(m => m.toString() === fromUserId) ||
            !group.members.some(m => m.toString() === toUserId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                success: false,
                message: "Both users must be members of the group"
            });
        }

        // Check balances and validate debt exists
        const balances = group.balances || {};
        const fromBalance = balances[fromUserId] || 0;
        const toBalance = balances[toUserId] || 0;

        // Validate that there's an actual debt to settle
        if (fromBalance === 0 && toBalance === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "No outstanding balance in this group. Add expenses first."
            });
        }

        // Calculate the actual debt between the two users
        let actualDebt = 0;
        if (fromBalance < 0 && toBalance > 0) {
            // fromUser owes toUser
            actualDebt = Math.min(Math.abs(fromBalance), toBalance);
        } else if (fromBalance > 0 && toBalance < 0) {
            // toUser owes fromUser (wrong direction)
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: `${group.members.find(m => m.toString() === toUserId) ? 'The other user' : 'They'} owe you, not the other way around.`
            });
        } else {
            // No debt between these two users
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "No outstanding debt between you and this user in this group."
            });
        }

        // Validate settlement amount doesn't exceed actual debt
        if (amount > actualDebt) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: `Settlement amount ($${amount}) exceeds actual debt ($${actualDebt.toFixed(2)})`
            });
        }

        // Create settlement record
        const settlement = await Settlement.create([{
            groupId,
            fromUser: fromUserId,
            toUser: toUserId,
            amount,
            description
        }], { session });

        // Update balances
        balances[fromUserId] = fromBalance + amount;  // Payer increases
        balances[toUserId] = toBalance - amount;      // Receiver decreases

        group.balances = balances;
        await group.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedSettlement = await Settlement.findById(settlement[0]._id)
            .populate("fromUser", "name email avatarUrl")
            .populate("toUser", "name email avatarUrl")
            .populate("groupId", "name")
            .select("-__v")
            .lean();

        res.status(201).json({
            success: true,
            message: "Settlement recorded successfully",
            data: populatedSettlement
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// Get settlement history
export const getSettlementHistory = async (req, res, next) => {
    try {
        const userId = req.userId;

        const settlements = await Settlement.find({
            $or: [{ fromUser: userId }, { toUser: userId }]
        })
            .sort({ createdAt: -1 })
            .populate("fromUser", "name email avatarUrl")
            .populate("toUser", "name email avatarUrl")
            .populate("groupId", "name")
            .select("-__v")
            .lean();

        const total = await Settlement.countDocuments({
            $or: [{ fromUser: userId }, { toUser: userId }]
        });

        res.status(200).json({
            success: true,
            data: settlements,
        });
    } catch (error) {
        next(error);
    }
};

// Get settlements for a specific group
export const getGroupSettlements = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(groupId).select('-__v');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        if (!group.members.some(member => member.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        const settlements = await Settlement.find({ groupId })
            .sort({ createdAt: -1 })
            .populate("fromUser", "name email avatarUrl")
            .populate("toUser", "name email avatarUrl")
            .select("-__v")
            .lean()
            .exec();

        const total = await Settlement.countDocuments({ groupId });

        res.status(200).json({
            success: true,
            data: settlements,
        });
    } catch (error) {
        next(error);
    }
};
