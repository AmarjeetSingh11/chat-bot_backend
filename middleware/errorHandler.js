// Global error handler middleware
export function errorHandler(err, req, res, next) {
	// Log error for debugging (but don't expose sensitive info)
	console.error(`[${new Date().toISOString()}] Error:`, {
		message: err.message,
		name: err.name,
		status: err.status || 500,
		path: req.path,
		method: req.method,
		ip: req.ip,
		userAgent: req.get('User-Agent')
	});

	// Handle custom error types
	if (err.name === 'ValidationError') {
		return res.status(400).json({
			error: 'Validation Error',
			message: err.message,
			status: 400
		});
	}

	if (err.name === 'ImageProcessingError') {
		return res.status(400).json({
			error: 'Image Processing Error',
			message: err.message,
			status: 400
		});
	}

	if (err.name === 'OpenAIApiError') {
		const response = {
			error: 'AI Service Error',
			message: err.message,
			status: err.status
		};

		// Add retry-after header for rate limiting
		if (err.retryAfter) {
			res.set('Retry-After', err.retryAfter);
		}

		return res.status(err.status).json(response);
	}

	if (err.name === 'AuthError') {
		return res.status(err.status).json({
			error: 'Authentication Error',
			message: err.message,
			status: err.status
		});
	}

	// Handle multer errors (file upload issues)
	if (err.name === 'MulterError') {
		let message = 'File upload error';
		if (err.code === 'LIMIT_FILE_SIZE') {
			message = 'File too large. Maximum 5MB allowed.';
		} else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
			message = 'Unexpected file field.';
		}
		
		return res.status(400).json({
			error: 'File Upload Error',
			message,
			status: 400
		});
	}

	// Handle Joi validation errors
	if (err.isJoi) {
		return res.status(400).json({
			error: 'Validation Error',
			message: err.message,
			status: 400
		});
	}

	// Handle MongoDB errors
	if (err.name === 'MongoError' || err.name === 'MongoServerError') {
		if (err.code === 11000) {
			return res.status(409).json({
				error: 'Duplicate Error',
				message: 'Resource already exists',
				status: 409
			});
		}
		return res.status(500).json({
			error: 'Database Error',
			message: 'Database operation failed',
			status: 500
		});
	}

	// Handle network timeouts
	if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
		return res.status(503).json({
			error: 'Service Unavailable',
			message: 'Network error. Please try again later.',
			status: 503
		});
	}

	// Handle OpenAI API specific errors
	if (err.status === 429) {
		const retryAfter = err.headers?.['retry-after'] || 60;
		res.set('Retry-After', retryAfter);
		return res.status(429).json({
			error: 'Rate Limit Exceeded',
			message: 'Too many requests. Please try again later.',
			status: 429,
			retryAfter
		});
	}

	if (err.status === 401) {
		return res.status(401).json({
			error: 'Authentication Failed',
			message: 'Invalid API key or authentication.',
			status: 401
		});
	}

	if (err.status === 403) {
		return res.status(403).json({
			error: 'Access Denied',
			message: 'Insufficient permissions or quota exceeded.',
			status: 403
		});
	}

	// Default error response
	const status = err.status || 500;
	const message = process.env.NODE_ENV === 'production' 
		? 'Internal Server Error' 
		: err.message || 'Something went wrong';

	return res.status(status).json({
		error: 'Server Error',
		message,
		status,
		...(process.env.NODE_ENV === 'development' && { stack: err.stack })
	});
}
