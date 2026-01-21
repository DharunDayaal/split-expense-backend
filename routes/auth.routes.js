import { Router } from 'express';
import { login, logout, refreshAccessToken, register } from '../controllers/auth.controller.js';
import { authMiddleWare } from '../middleware/auth.middleware.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refreshAccessToken);
authRouter.post('/logout', authMiddleWare, logout);

export default authRouter;
