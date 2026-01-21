import User from "../models/user.model.js";

export const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

export const updateUserProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const { name, avatarUrl, isUpdated } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, avatarUrl, isUpdated },
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
}

export const updateUserAvatar = async (req, res, next) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        // Cloudinary stores the URL in req.file.path
        const imageUrl = req.file.secure_url

        const user = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: imageUrl,
                isUpdated: 1
            },
            { new: true }
        ).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Profile image uploaded successfully",
            data: {
                imageUrl
            }
        });
    } catch (error) {
        next(error);
    }
}