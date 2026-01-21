import { Router } from "express";
import { addMemberToGroup, createGroup, getGroupDetails, listAllGroups, removeMemberFromGroup, uploadGroupAvatar } from "../controllers/group.controller.js";
import { authMiddleWare } from "../middleware/auth.middleware.js";
import { uploadImages } from "../middleware/upload.milddleware.js";

const groupRouter = Router();

groupRouter.post('/create', authMiddleWare, createGroup);
groupRouter.get('/list', authMiddleWare, listAllGroups);
groupRouter.post('/add-members', authMiddleWare, addMemberToGroup);
groupRouter.get('/:id/details', authMiddleWare, getGroupDetails)
groupRouter.post("/remove/member", authMiddleWare, removeMemberFromGroup)
groupRouter.post("/upload/avatar/:id", authMiddleWare, uploadImages.single('image'), uploadGroupAvatar);

export default groupRouter;