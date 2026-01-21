import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Settlement amount is required'],
        min: [0, 'Settlement amount must be positive']
    },
    description: {
        type: String,
        trim: true,
        maxLength: 200,
        default: null
    },
}, { timestamps: true });

settlementSchema.index({ groupId: 1, fromUser: 1, toUser: 1, createdAt: -1 });

const Settlement = mongoose.model('Settlement', settlementSchema);

export default Settlement;