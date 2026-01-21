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

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/group', groupRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/settlement', settlementRouter);

app.use(errorMiddleware);

app.listen(3000, async () => {
    await connectToDatabase();
    console.log('Server is started on port 3000');
})