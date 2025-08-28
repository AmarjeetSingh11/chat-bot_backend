import mongoose from "mongoose";
import { config } from "../config/index.js";


// Connect to MongoDB
export async function connectDatabase() {
	try {
		await mongoose.connect(config.mongoUri);
		console.log("✅ Connected to MongoDB successfully");
		
		// Handle connection events
		mongoose.connection.on('error', (err) => {
			console.error("❌ MongoDB connection error:", err);
		});
		
		mongoose.connection.on('disconnected', () => {
			console.warn("⚠️ MongoDB disconnected");
		});
		
		mongoose.connection.on('reconnected', () => {
			console.log("🔄 MongoDB reconnected");
		});
		
		// Graceful shutdown
		process.on('SIGINT', async () => {
			await mongoose.connection.close();
			console.log("MongoDB connection closed through app termination");
			process.exit(0);
		});
		
	} catch (error) {
		console.error("❌ Failed to connect to MongoDB:", error);
		throw error;
	}
}

// Disconnect from MongoDB
export async function disconnectDatabase() {
	try {
		await mongoose.connection.close();
		console.log("✅ MongoDB connection closed");
	} catch (error) {
		console.error("❌ Error closing MongoDB connection:", error);
		throw error;
	}
}

// Check database connection status
export function getDatabaseStatus() {
	return {
		connected: mongoose.connection.readyState === 1,
		readyState: mongoose.connection.readyState,
		host: mongoose.connection.host,
		port: mongoose.connection.port,
		name: mongoose.connection.name
	};
}
