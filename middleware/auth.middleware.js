import { throwError } from "../utils/error.js";
import { verifyAccessToken } from "../utils/token.js";

export const authMiddleWare = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throwError('Authorization header missing or malformed', 401);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throwError('Access token missing', 401);
        }

        const decoded = verifyAccessToken(token);

        // Optional: Verify session still exists
        // const session = await Session.findOne({
        //     accessToken: token,
        //     user: decoded.userId
        // });

        // if (!session) {
        //     throwError('Session not found or expired', 401);
        // }

        //Attach user to request
        req.userId = decoded.userId;
        req.sessionId = decoded._id;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Access token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        next(error);
    }
}
