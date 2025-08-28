import Joi from "joi";
import User from "../models/User.js";
import { 
	generateAccessToken, 
	generateRefreshToken, 
	saveRefreshToken, 
	verifyRefreshToken,
	verifyRefreshTokenFromDB, 
	revokeRefreshToken 
} from "../services/authService.js";
import { config } from "../config/index.js";

// Validation schemas
const registerSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required()
});

const refreshSchema = Joi.object({
	refreshToken: Joi.string().required()
});

// Custom error classes
class AuthError extends Error {
	constructor(message, status = 401) {
		super(message);
		this.name = "AuthError";
		this.status = status;
	}
}

// User registration
export async function register(req, res, next) {
	try {
		// Validate input
		const { error, value } = registerSchema.validate(req.body);
		if (error) {
			throw new AuthError(`Validation failed: ${error.message}`, 400);
		}

		const { email, password } = value;

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			throw new AuthError("User with this email already exists", 409);
		}

		// Create new user
		const user = new User({
			email,
			password
		});

		await user.save();

		// Generate tokens
		const accessToken = generateAccessToken(user._id, user.email, user.role);
		const refreshToken = generateRefreshToken(user._id, user.email, user.role);

		// Save refresh token
		await saveRefreshToken(user._id, refreshToken, {
			userAgent: req.get('User-Agent'),
			ip: req.ip
		});

		// Update last login
		user.lastLogin = new Date();
		await user.save();

		res.status(201).json({
			message: "User registered successfully",
			user: {
				id: user._id,
				email: user.email,
				role: user.role
			},
			tokens: {
				accessToken,
				refreshToken,
				accessTokenExpiry: config.accessTokenExpiry,
				refreshTokenExpiry: `${config.refreshTokenExpiryDays} days`
			}
		});
	} catch (err) {
		next(err);
	}
}

// User login
export async function login(req, res, next) {
	try {
		// Validate input
		const { error, value } = loginSchema.validate(req.body);
		if (error) {
			throw new AuthError(`Validation failed: ${error.message}`, 400);
		}

		const { email, password } = value;

		// Find user by email
		const user = await User.findOne({ email, isActive: true });
		if (!user) {
			throw new AuthError("Invalid email or password", 401);
		}

		// Verify password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			throw new AuthError("Invalid email or password", 401);
		}

		// Generate tokens
		const accessToken = generateAccessToken(user._id, user.email, user.role);
		const refreshToken = generateRefreshToken(user._id, user.email, user.role);

		// Save refresh token
		await saveRefreshToken(user._id, refreshToken, {
			userAgent: req.get('User-Agent'),
			ip: req.ip
		});

		// Update last login
		user.lastLogin = new Date();
		await user.save();

		res.json({
			message: "Login successful",
			user: {
				id: user._id,
				email: user.email,
				role: user.role
			},
			tokens: {
				accessToken,
				refreshToken,
				accessTokenExpiry: config.accessTokenExpiry,
				refreshTokenExpiry: `${config.refreshTokenExpiryDays} days`
			}
		});
	} catch (err) {
		next(err);
	}
}

// Refresh access token
export async function refreshToken(req, res, next) {
	try {
		// Validate input
		const { error, value } = Joi.object({ refreshToken: Joi.string().required() }).validate(req.body);
		if (error) {
			throw new AuthError(`Validation failed: ${error.message}`, 400);
		}

		const { refreshToken: token } = value;

		// First verify JWT signature
		const decoded = verifyRefreshToken(token);
		
		// Then verify from database
		await verifyRefreshTokenFromDB(token);
		
		// Get user
		const user = await User.findById(decoded.userId);
		if (!user || !user.isActive) {
			throw new AuthError("User not found or inactive", 401);
		}

		// Generate new access token
		const newAccessToken = generateAccessToken(user._id, user.email, user.role);

		res.json({
			message: "Token refreshed successfully",
			accessToken: newAccessToken,
			accessTokenExpiry: config.accessTokenExpiry
		});
	} catch (err) {
		next(err);
	}
}

// Logout (revoke refresh token)
export async function logout(req, res, next) {
	try {
		const { refreshToken } = req.body;
		
		if (refreshToken) {
			await revokeRefreshToken(refreshToken);
		}

		res.json({
			message: "Logout successful"
		});
	} catch (err) {
		next(err);
	}
}

// Get current user profile
export async function getProfile(req, res, next) {
	try {
		const user = await User.findById(req.user.userId).select('-password');
		if (!user) {
			throw new AuthError("User not found", 404);
		}

		res.json({
			user: {
				id: user._id,
				email: user.email,
				role: user.role
			}
		});
	} catch (err) {
		next(err);
	}
}
