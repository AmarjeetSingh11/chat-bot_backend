import { Router } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import authRouter from "./auth.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.use("/auth", authRouter);

// Protected routes (require authentication)
router.use("/health", authenticateToken, healthRouter);
router.use("/chat", authenticateToken, chatRouter);

export default router;


