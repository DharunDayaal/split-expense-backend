import mongoose from "mongoose";
import Expense from "../models/expense.model.js";
import Group from "../models/group.model.js";

export const createExpense = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { groupId, amount, description, participants } = req.body;
        const paidBy = req.userId;

        const group = await Group.findById(groupId).session(session);
        if (!group) {
            await session.abortTransaction();
            await session.endSession();
            res.status(404).json({
                success: false,
                message: 'Group not found'
            });
            return;
        }

        if (!group.members.some(member => member.toString() === paidBy)) {
            res.status(403).json({
                success: false,
                message: 'Payer is not a member of the group'
            });
            return;
        }

        const expenseParticipants = participants && participants.length > 0
            ? participants
            : group.members.map(member => member.toString());

        const invalidParticipants = expenseParticipants.filter(participant => !group.members.some(member => member.toString() === participant));
        if (invalidParticipants.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Some participants are not members of the group',
                invalidParticipants
            });
            return;
        }

        const expense = await Expense.create([{
            groupId,
            paidBy,
            amount,
            description,
            participants: expenseParticipants
        }], { session });

        const sharePerPerson = amount / expenseParticipants.length;
        const balances = group.balances || new Map();

        // First, deduct share from all participants (including payer)
        expenseParticipants.forEach(participantId => {
            const participantBalance = balances.get(participantId.toString()) || 0;
            balances.set(participantId.toString(), participantBalance - sharePerPerson);
        });

        // Then, add the full amount the payer paid
        const payerBalance = balances.get(paidBy.toString()) || 0;
        balances.set(paidBy.toString(), payerBalance + amount)

        group.balances = balances;
        await group.save({ session });

        await session.commitTransaction();
        await session.endSession();

        const createdExpense = await Expense.findById(expense[0]._id)
            .populate('paidBy', 'name email avatarUrl')
            .populate('participants', 'name email avatarUrl')
            .select('-__v')
            .lean();

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: createdExpense
        });
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        next(error);
    }
}

export const getGroupExpenses = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (!group.members.some(member => member.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        const expenses = await Expense.find({ groupId })
            .sort({ createdAt: -1 })
            .populate('paidBy', 'name email avatarUrl')
            .populate('participants', 'name email avatarUrl')
            .select('-__v')
            .lean()
            .exec();

        res.status(200).json({
            success: true,
            data: expenses
        });
    } catch (error) {
        next(error);
    }
}

export const    getExpenseById = async (req, res, next) => {
    try {
        const { expenseId } = req.params;
        const userId = req.userId;

        const expense = await Expense.findById(expenseId)
            .populate('paidBy', 'name email avatarUrl')
            .populate('participants', 'name email avatarUrl')
            .populate('groupId', 'name groupAvatarUrl')
            .select('-__v')
            .lean()
            .exec();

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const group = await Group.findById(expense.groupId._id);
        if (!group.members.some(member => member.toString() === userId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this expense'
            });
        }

        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (error) {
        next(error);
    }
}

export const updateExpense = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { expenseId } = req.params;
        const { amount, description, participants } = req.body;
        const userId = req.userId;

        const expense = await Expense.findById(expenseId).session(session);
        if (!expense) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const group = await Group.findById(expense.groupId).session(session);

        if (expense.paidBy.toString() !== userId && group.createdBy.toString() !== userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this expense'
            });
        }

        // Validate new participants if provided
        if (participants && participants.length > 0) {
            const invalidParticipants = participants.filter(
                participant => !group.members.some(member => member.toString() === participant)
            );
            if (invalidParticipants.length > 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: 'Some participants are not members of the group',
                    invalidParticipants
                });
            }
        }

        const balances = group.balances || new Map();

        // Revert old balances
        const oldShare = expense.amount / expense.participants.length;

        expense.participants.forEach(participantId => {
            const participantBalance = balances.get(participantId.toString()) || 0;
            balances.set(participantId.toString(), participantBalance + oldShare);
        });

        const oldPayerBalance = balances.get(expense.paidBy.toString()) || 0;
        balances.set(expense.paidBy.toString(), oldPayerBalance - expense.amount);

        // Update expense fields
        if (amount !== undefined) expense.amount = amount;
        if (description !== undefined) expense.description = description;
        if (participants && participants.length > 0) expense.participants = participants;

        // Apply new balances
        const newShare = expense.amount / expense.participants.length;

        expense.participants.forEach(participantId => {
            const participantBalance = balances.get(participantId.toString()) || 0;
            balances.set(participantId.toString(), participantBalance - newShare);
        });

        const newPayerBalance = balances.get(expense.paidBy.toString()) || 0;
        balances.set(expense.paidBy.toString(), newPayerBalance + expense.amount);

        group.balances = balances;
        await group.save({ session });
        await expense.save({ session });

        await session.commitTransaction();
        session.endSession();

        const updatedExpense = await Expense.findById(expenseId)
            .populate('paidBy', 'name email avatarUrl')
            .populate('participants', 'name email avatarUrl')
            .select('-__v')
            .lean()
            .exec();

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: updatedExpense
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}

export const deleteExpense = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { expenseId } = req.params;
        const userId = req.userId;

        const expense = await Expense.findById(expenseId).session(session);
        if (!expense) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const group = await Group.findById(expense.groupId).session(session);

        if (expense.paidBy.toString() !== userId && group.createdBy.toString() !== userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this expense'
            });
        }

        const balances = group.balances || new Map();

        // Revert balances
        const sharePerPerson = expense.amount / expense.participants.length;

        expense.participants.forEach(participantId => {
            const participantBalance = balances.get(participantId.toString()) || 0;
            balances.set(participantId.toString(), participantBalance + sharePerPerson);
        });

        const payerBalance = balances.get(expense.paidBy.toString()) || 0;
        balances.set(expense.paidBy.toString(), payerBalance - expense.amount);

        group.balances = balances;
        await group.save({ session });
        await expense.deleteOne({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}