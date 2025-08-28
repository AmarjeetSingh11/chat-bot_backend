import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

function requireString(name, fallback = "") {
	const value = process.env[name] ?? fallback;
	return value;
}

function requireBoolean(name, fallback = false) {
	const value = process.env[name];
	if (value === undefined) return fallback;
	return value.toLowerCase() === 'true' || value === '1';
}

export const config = {
	// Server configuration
	nodeEnv: requireString("NODE_ENV", "development"),
	port: Number.parseInt(requireString("PORT", "3000"), 10),
	
	// Database configuration
	mongoUri: requireString("MONGO_URI", "mongodb://localhost:27017/chatbot"),
	
	// OpenAI configuration (no hardcoded fallback; must be provided via env)
	openAiApiKey: requireString("OPENAI_API_KEY"),
	openAiTextModel: requireString("OPENAI_MODEL", "gpt-4o-mini"),
	openAiMultimodalModel: requireString("OPENAI_MM_MODEL", "gpt-4o-mini"),
	
	// JWT configuration (no hardcoded fallback; must be provided via env)
	jwtAccessSecret: requireString("JWT_ACCESS_SECRET"),
	jwtRefreshSecret: requireString("JWT_REFRESH_SECRET"),
	accessTokenExpiry: requireString("ACCESS_TOKEN_EXPIRY", "15m"),
	refreshTokenExpiryDays: Number.parseInt(requireString("REFRESH_TOKEN_EXPIRY_DAYS", "30"), 10),
	
	// API limits and timeouts
	maxRetries: Number.parseInt(requireString("MAX_RETRIES", "3"), 10),
	requestTimeout: Number.parseInt(requireString("REQUEST_TIMEOUT", "30000"), 10),
	maxFileSize: requireString("MAX_FILE_SIZE", "5mb"),
	maxMessageLength: Number.parseInt(requireString("MAX_MESSAGE_LENGTH", "4000"), 10),
	maxContextLength: Number.parseInt(requireString("MAX_CONTEXT_LENGTH", "8000"), 10)
};

// Validate required environment variables for deployment
function validateConfig() {
	const required = [
		'OPENAI_API_KEY',
		'JWT_ACCESS_SECRET', 
		'JWT_REFRESH_SECRET'
	];
	
	const missing = required.filter(key => !process.env[key]);
	
	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}
}

// Only validate in production to avoid blocking local development
if (config.nodeEnv === 'production') {
	validateConfig();
}


