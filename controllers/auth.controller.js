import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NODE_ENV } from "../config/env.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import { throwError } from "../utils/error.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiryDate, verifyRefreshToken } from "../utils/token.js";

export const register = async (req, res, next) => {

    const session = await mongoose.startSession();

    session.startTransaction();
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email }, { password: 0 });

        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create([{
            name,
            email,
            password: hashedPassword
        }], { session });

        const payload = {
            userId: newUser[0]._id,
            email: newUser[0].email
        }

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await Session.create({
            user: newUser[0]._id,
            accessToken,
            refreshToken,
            refreshTokenExpiresAt: getRefreshTokenExpiryDate(),
            deviceInfo: {
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection.remoteAddress
            }
        });
        await session.commitTransaction();
        session.endSession();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })


        res.status(200).json({
            success: true,
            message: 'User registered successfully',
            data: {
                accessToken,
                user: newUser[0]
            }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log("Error on register API", error);
        next(error);
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            throwError("User not found", 404);
        }

        const isValidPassword = await bcrypt.compare(password, user?.password);
        if (!isValidPassword) {
            throwError("Invalid credentials", 401);
        }

        const payload = {
            userId: user._id,
            email: user.email
        }

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await Session.create({
            user: user._id,
            accessToken,
            refreshToken,
            refreshTokenExpiresAt: getRefreshTokenExpiryDate(),
            deviceInfo: {
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection.remoteAddress
            }
        });

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                accessToken,
                user
            }
        });
    } catch (error) {
        next(error);
    }
}

export const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            throwError("Refresh token is required", 400);
        }

        const decode = verifyRefreshToken(refreshToken);

        const session = await Session.findOne({
            refreshToken,
            user: decode.userId
        })

        if (!session) {
            throwError("Invalid refresh token", 401);
        }

        if (new Date() > session.refreshTokenExpiresAt) {
            await session.deleteOne({ _id: session._id });
            throwError("Refresh token has expired, please login again", 401);
        }

        const accessToken = generateAccessToken({ userId: decode.userId, email: decode.email });
        //const newRefreshToken = generateRefreshToken({ userId: decode.userId, email: decode.email });

        session.accessToken = accessToken;

        session.lastUsedAt = new Date();

        await session.save();

        res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            data: {
                accessToken
            }
        })

    } catch (error) {
        next(error);
    }
}


export const logout = async (req, res, next) => {
    try {
        // Get access token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throwError('Access token not provided', 401);
        }

        const accessToken = authHeader.split(' ')[1];

        // Delete session by access token
        const result = await Session.deleteOne({ accessToken });

        if (result.deletedCount === 0) {
            throwError('Session not found', 404);
        }

        // Clear cookie
        res.clearCookie('refreshToken');

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};