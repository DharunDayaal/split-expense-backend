import { Router } from "express";
import {
    createExpense,
    deleteExpense,
    getExpenseById,
    getGroupExpenses,
    updateExpense
} from "../controllers/expense.controller.js";
import { authMiddleWare } from "../middleware/auth.middleware.js";


const expenseRouter = Router();

expenseRouter.post('/group/create', authMiddleWare, createExpense);
expenseRouter.get('/group/:groupId', authMiddleWare, getGroupExpenses);
expenseRouter.get('/:expenseId', authMiddleWare, getExpenseById);
expenseRouter.post('/update/:expenseId', authMiddleWare, updateExpense);
expenseRouter.post('/delete/:expenseId', authMiddleWare, deleteExpense);

export default expenseRouter;