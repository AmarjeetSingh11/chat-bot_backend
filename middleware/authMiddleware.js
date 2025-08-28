import { verifyAccessToken } from "../services/authService.js";

// Authentication middleware
export function authenticateToken(req, res, next) {
	try {
		// Get token from header
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

		if (!token) {
			return res.status(401).json({
				error: 'Authentication Required',
				message: 'Access token is required in Authorization header',
				status: 401
			});
		}

		// Verify token
		const decoded = verifyAccessToken(token);
		
		// Add user info to request
		req.user = {
			userId: decoded.userId,
			email: decoded.email,
			role: decoded.role
		};

		next();
	} catch (error) {
		return res.status(401).json({
			error: 'Authentication Failed',
			message: error.message,
			status: 401
		});
	}
}

// Optional authentication middleware (for endpoints that can work with or without auth)
export function optionalAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.split(' ')[1];

		if (token) {
			const decoded = verifyAccessToken(token);
			req.user = {
				userId: decoded.userId,
				email: decoded.email,
				role: decoded.role
			};
		}

		next();
	} catch (error) {
		// Continue without authentication
		next();
	}
}

// Role-based access control middleware
export function requireRole(allowedRoles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				error: 'Authentication Required',
				message: 'Access token is required',
				status: 401
			});
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json({
				error: 'Access Denied',
				message: 'Insufficient permissions for this operation',
				status: 403
			});
		}

		next();
	};
}

// Admin-only middleware
export const requireAdmin = requireRole(['admin']);

// User or admin middleware
export const requireUser = requireRole(['user', 'admin']);
