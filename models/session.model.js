import mongoose from "mongoose"

const sessionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "DB validation Error: User is required"]
    },
    accessToken: {
        type: String,
        required: [true, 'DB validation Error: Access token is required']
    },
    refreshToken: {
        type: String,
        required: [true, 'DB validation Error: Refresh token is required']
    },
    refreshToken: {
        type: String,
        required: true
    },
    refreshTokenExpiresAt: {
        type: Date,
        required: true
    },
    deviceInfo: {
        userAgent: String,
        ip: String
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

sessionSchema.index({ refreshTokenExpiresAt: 1 }, { expireAfterSeconds: 0 })

const Session = mongoose.model('Session', sessionSchema)

export default Session