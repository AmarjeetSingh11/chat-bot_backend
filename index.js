import express from "express";
import { config } from "./config/index.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { timeout, validateRequestSize } from "./middleware/timeout.js";
import { connectDatabase, getDatabaseStatus } from "./services/database.js";

const app = express();

// Trust proxy for cloud deployments (Render, Heroku, etc.)
// Only trust the first proxy hop (Render's load balancer)
app.set('trust proxy', 1);

// Basic security and parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

// Request timeout and size validation
app.use(timeout(30000)); // 30 seconds
app.use(validateRequestSize('5mb'));

// Rate limiting (secure for proxy environments)
const limiter = rateLimit({ 
	windowMs: 60 * 1000, // 1 minute
	max: 60, // limit each IP to 60 requests per windowMs
	message: {
		error: 'Rate Limit Exceeded',
		message: 'Too many requests from this IP, please try again later.',
		status: 429
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	// Custom key generator for better proxy handling
	keyGenerator: (req) => {
		// Use X-Forwarded-For if available, fallback to connection remote address
		return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || req.ip;
	},
	// Add retry-after header
	handler: (req, res) => {
		res.set('Retry-After', '60');
		res.status(429).json({
			error: 'Rate Limit Exceeded',
			message: 'Too many requests from this IP, please try again later.',
			status: 429,
			retryAfter: 60
		});
	}
});
app.use(limiter);

// Routes
app.use("/", routes);

// 404 handler
app.use((req, res) => {
	return res.status(404).json({ 
		error: "Not Found",
		message: `Route ${req.method} ${req.path} not found`,
		status: 404
	});
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server function
async function startServer() {
	try {
		// Connect to MongoDB
		await connectDatabase();
		
		// Start HTTP server
		const port = config.port || 3000;
		app.listen(port, () => {
			console.log(`🚀 Server listening on port ${port}`);
			console.log(`🌍 Environment: ${config.nodeEnv}`);
			console.log(`🔐 Health check: http://localhost:${port}/health (requires auth)`);
			console.log(`👤 Auth endpoints: http://localhost:${port}/auth`);
			console.log(`💬 Chat endpoints: http://localhost:${port}/chat (requires auth)`);
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
}

// Start the server
startServer();


