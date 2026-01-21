import Group from "../models/group.model.js";

export const createGroup = async (req, res, next) => {
    try {
        const { name, description, members, groupAvatarUrl } = req.body;
        const userId = req.userId

        if (!name || name.length < 3 || name.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Group name must be between 3 and 50 characters long."
            })
        }
        const groupData = {
            name,
            createdBy: userId,
            description,
            members: [userId, ...(Array.isArray(members) ? members.filter(m => m !== userId) : [])],
            groupAvatarUrl: groupAvatarUrl || null
        }

        const response = await Group.create(groupData);
        const group = await Group.findById(response._id).select('-__v').lean();
        res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: group
        })
    } catch (error) {
        next(error);
    }
}

export const listAllGroups = async (req, res, next) => {
    try {
        const userId = req.userId;
        const groups = await Group.find({
            $or: [{ createdBy: userId }, { members: userId }]
        })
            .populate("createdBy", "name email avatarUrl")
            .populate("members", "name email avatarUrl")
            .select("-__v -balances -description")
            .sort({ updatedAt: -1 })
            .lean()
            .exec();

        const groupList = groups.map(group => ({
            _id: group._id,
            name: group.name,
            groupAvatarUrl: group.groupAvatarUrl,
            membersCount: group.members.length,
            createdBy: group.createdBy,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            tag: group.tag
        }));

        res.status(200).json({
            success: true,
            message: "Groups retrieved successfully",
            data: groupList
        })
    } catch (error) {
        next(error);
    }
}

export const addMemberToGroup = async (req, res, next) => {
    try {
        const { groupId, memberIds } = req.body;
        const userId = req.userId;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is group creator or admin
        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Only group creator can add members"
            });
        }

        const updatedGroup = await Group.findOneAndUpdate(
            { _id: groupId },
            { $addToSet: { members: { $each: memberIds } } },
            { new: true }
        )
            .populate("createdBy", "name email avatarUrl")
            .populate("members", "name email avatarUrl")
            .select("-__v")
            .lean()
            .exec();

        res.status(200).json({
            success: true,
            message: "Members added successfully",
            data: updatedGroup
        })
    } catch (error) {
        next(error);
    }
}

export const getGroupDetails = async (req, res, next) => {
    try {
        const groupId = req.params.id;
        const userId = req.userId;

        const group = await Group.findById(groupId)
            .populate("createdBy", "name email avatarUrl")
            .populate("members", "name email avatarUrl")
            .select("-__v")
            .lean();

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is a member
        if (!group.members.some(member => member._id.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        // Calculate total spend from balances
        let totalSpend = 0;
        const balances = group.balances || {};

        // Total spend is sum of all positive balances (what people paid)
        for (const [memberId, balance] of Object.entries(balances)) {
            if (balance > 0) {
                totalSpend += balance;
            }
        }

        // Get current user's balance
        const userBalance = balances[userId] || 0;

        // Calculate individual debts for current user
        const debts = [];
        for (const member of group.members) {
            const memberId = member._id.toString();
            if (memberId === userId) continue;

            const memberBalance = balances[memberId] || 0;

            // If user has positive balance and member has negative balance
            if (userBalance > 0 && memberBalance < 0) {
                const amount = Math.min(userBalance, Math.abs(memberBalance));
                if (amount > 0) {
                    debts.push({
                        user: member,
                        owesYou: true,
                        amount: amount
                    });
                }
            }
            // If user has negative balance and member has positive balance
            else if (userBalance < 0 && memberBalance > 0) {
                const amount = Math.min(Math.abs(userBalance), memberBalance);
                if (amount > 0) {
                    debts.push({
                        user: member,
                        owesYou: false,
                        amount: amount
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Group details retrieved successfully",
            data: {
                ...group,
                membersCount: group.members.length,
                totalSpend: parseFloat(totalSpend.toFixed(2)),
                userBalance: parseFloat(userBalance.toFixed(2)),
                debts: debts.map(debt => ({
                    user: debt.user,
                    owesYou: debt.owesYou,
                    amount: parseFloat(debt.amount.toFixed(2))
                }))
            }
        });
    } catch (error) {
        next(error);
    }
}

export const removeMemberFromGroup = async (req, res, next) => {
    try {
        const { groupId, memberId } = req.body;
        const userId = req.userId;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        // Check if user is group creator or the member themselves
        if (group.createdBy.toString() !== userId && memberId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Only group creator or the member can remove themselves"
            });
        }

        // Check if member has unsettled balance
        const balances = group.balances || {};
        const memberBalance = balances[memberId] || 0;

        if (memberBalance !== 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot remove member with unsettled balance. Please settle up first."
            });
        }

        const updatedGroup = await Group.findOneAndUpdate(
            { _id: groupId },
            { $pull: { members: memberId } },
            { new: true }
        )
            .populate("createdBy", "name email avatarUrl")
            .populate("members", "name email avatarUrl")
            .select("-__v")
            .lean()
            .exec();

        res.status(200).json({
            success: true,
            message: "Member removed successfully",
            data: updatedGroup
        });
    } catch (error) {
        next(error);
    }
}

export const uploadGroupAvatar = async (req, res, next) => {
    try {
        const groupId = req.params.id;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        // Cloudinary stores the URL in req.file.path
        const imageUrl = req.file.secure_url

        const group = await Group.findByIdAndUpdate(
            { _id: groupId },
            {
                groupAvatarUrl: imageUrl,
            },
            { new: true }
        ).select('-__v');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        res.json({
            success: true,
            message: "Group image uploaded successfully",
            data: {
                imageUrl
            }
        });
    } catch (error) {
        next(error);
    }
}
