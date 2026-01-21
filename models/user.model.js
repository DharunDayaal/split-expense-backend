import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User name is required'],
        trim: true,
        minLength: 3,
        maxLength: 40
    },
    email: {
        type: String,
        required: [true, 'User email is required'],
        trim: true,
        unique: true,
        minLength: 6,
        maxLength: 60,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'User password is required'],
        trim: true,
        minLength: 6,
        maxLength: 60
    },
    avatarUrl: {
        type: String,
        trim: true,
        default: null
    },
    isUpdated: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    }

}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;