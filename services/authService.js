import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import RefreshToken from "../models/RefreshToken.js";

// Generate access token
export function generateAccessToken(userId, email, role) {
	return jwt.sign(
		{ 
			userId, 
			email, 
			role,
			type: 'access'
		},
		config.jwtAccessSecret,
		{ expiresIn: config.accessTokenExpiry }
	);
}

// Generate refresh token using JWT
export function generateRefreshToken(userId, email, role) {
	return jwt.sign(
		{ 
			userId, 
			email, 
			role,
			type: 'refresh'
		},
		config.jwtRefreshSecret,
		{ expiresIn: `${config.refreshTokenExpiryDays}d` }
	);
}

// Verify access token
export function verifyAccessToken(token) {
	try {
		const decoded = jwt.verify(token, config.jwtAccessSecret);
		if (decoded.type !== 'access') {
			throw new Error('Invalid token type');
		}
		return decoded;
	} catch (error) {
		throw new Error('Invalid or expired access token');
	}
}

// Verify refresh token
export function verifyRefreshToken(token) {
	try {
		const decoded = jwt.verify(token, config.jwtRefreshSecret);
		if (decoded.type !== 'refresh') {
			throw new Error('Invalid token type');
		}
		return decoded;
	} catch (error) {
		throw new Error('Invalid or expired refresh token');
	}
}

// Save refresh token to database
export async function saveRefreshToken(userId, refreshToken, deviceInfo) {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiryDays);

	const tokenDoc = new RefreshToken({
		userId,
		token: refreshToken,
		deviceInfo,
		expiresAt
	});

	await tokenDoc.save();
	return tokenDoc;
}

// Verify refresh token from database
export async function verifyRefreshTokenFromDB(token) {
	const tokenDoc = await RefreshToken.findOne({ 
		token, 
		isRevoked: false,
		expiresAt: { $gt: new Date() }
	});

	if (!tokenDoc) {
		throw new Error('Refresh token not found or revoked');
	}

	// Also verify JWT signature
	try {
		const decoded = jwt.verify(token, config.jwtRefreshSecret);
		if (decoded.type !== 'refresh') {
			throw new Error('Invalid token type');
		}
		return tokenDoc;
	} catch (error) {
		throw new Error('Invalid refresh token signature');
	}
}

// Revoke refresh token
export async function revokeRefreshToken(token) {
	await RefreshToken.updateOne(
		{ token },
		{ isRevoked: true }
	);
}

// Revoke all refresh tokens for a user
export async function revokeAllUserTokens(userId) {
	await RefreshToken.updateMany(
		{ userId },
		{ isRevoked: true }
	);
}

// Clean up expired tokens
export async function cleanupExpiredTokens() {
	await RefreshToken.deleteMany({
		expiresAt: { $lt: new Date() }
	});
}
