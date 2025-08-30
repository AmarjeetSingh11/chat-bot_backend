import { Router } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import authRouter from "./auth.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();
//only to check if the server is running or not 
router.get("/", (req, res) => {
	res.json({ 
		message: "Server is running!", 
		status: "ok",
		timestamp: new Date().toISOString()
	});
});
// Public routes
router.use("/auth", authRouter);

// Protected routes (require authentication)
router.use("/health", authenticateToken, healthRouter);
router.use("/chat", authenticateToken, chatRouter);

export default router;



