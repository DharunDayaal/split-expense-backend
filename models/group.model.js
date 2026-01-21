import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true,
        minLength: 3,
        maxLength: 50
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    description: {
        type: String,
        trim: true,
        maxLength: 200,
        default: null
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    balances: {
        type: Map,
        of: Number,
        default: {}
    },
    groupAvatarUrl: {
        type: String
    },
    tag: {
        type: String,
        trim: true,
        maxLength: 20,
        default: null
    }
}, { timestamps: true });

groupSchema.index({ createdBy: 1, members: 1 });

const Group = mongoose.model('Group', groupSchema);

export default Group;