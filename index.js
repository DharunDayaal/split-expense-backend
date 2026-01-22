import cookieParser from 'cookie-parser';
import express from 'express';
import { connectToDatabase } from './database/db.js';
import corsConfig from './middleware/cors.middleware.js';
import errorMiddleware from './middleware/error.middleware.js';
import authRouter from './routes/auth.routes.js';
import expenseRouter from './routes/expense.routes.js';
import groupRouter from './routes/group.routes.js';
import settlementRouter from './routes/settlement.routes.js';
import userRouter from './routes/user.routes.js';

const app = express();

app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(503).json({
            success: false,
            error: 'Database connection failed. Please try again.'
        });
    }
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/group', groupRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/settlement', settlementRouter);

app.use(errorMiddleware);

// For Vercel serverless, export the app
export default app;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, async () => {
        await connectToDatabase();
        console.log(`Server is started on port ${PORT}`);
    });
}
