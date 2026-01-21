import mongoose from "mongoose";


const expenseSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Expense amount is required'],
        min: [0, 'Expense amount must be positive']
    },
    description: {
        type: String,
        trim: true,
        maxLength: 200,
        default: null
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

expenseSchema.index({ groupId: 1, paidBy: 1, createdAt: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;