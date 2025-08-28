import { Router } from "express";
import { 
	register, 
	login, 
	logout, 
	refreshToken, 
	getProfile 
} from "../controller/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);

// Protected routes
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getProfile);

export default router;
