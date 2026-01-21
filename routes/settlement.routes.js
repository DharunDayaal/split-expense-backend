import { Router } from "express";
import {
    createSettlement,
    getGroupSettlements,
    getSettlementHistory,
    getUserBalances
} from "../controllers/settlement.controller.js";
import { authMiddleWare } from "../middleware/auth.middleware.js";

const settlementRouter = Router();

settlementRouter.get('/balances', authMiddleWare, getUserBalances);
settlementRouter.post('/create', authMiddleWare, createSettlement);
settlementRouter.get('/history', authMiddleWare, getSettlementHistory);
settlementRouter.get('/group/:groupId', authMiddleWare, getGroupSettlements);

export default settlementRouter;
