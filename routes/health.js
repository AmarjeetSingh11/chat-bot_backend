import { Router } from "express";
import { config } from "../config/index.js";
import { getDatabaseStatus } from "../services/database.js";

const router = Router();

router.get("/", (req, res) => {
	const healthInfo = {
		status: "ok",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		environment: config.nodeEnv,
		version: "1.0.0",
		user: {
			id: req.user.userId,
			email: req.user.email,
			role: req.user.role
		},
		database: getDatabaseStatus()
	};

	return res.json(healthInfo);
});

export default router;


