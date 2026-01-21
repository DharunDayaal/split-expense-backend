import { Router } from "express";
import { getUserProfile, updateUserAvatar, updateUserProfile } from "../controllers/user.controller.js";
import { authMiddleWare } from "../middleware/auth.middleware.js";
import { uploadImages } from "../middleware/upload.milddleware.js";

const userRouter = Router();

userRouter.get('/me/:id', authMiddleWare, getUserProfile);
userRouter.post('/update/me/:id', authMiddleWare, updateUserProfile);
userRouter.post('/update/avatar', authMiddleWare, uploadImages.single("image"), updateUserAvatar);

export default userRouter;