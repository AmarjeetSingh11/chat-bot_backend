// Request timeout middleware
export function timeout(limit = 30000) { // 30 seconds default
	return (req, res, next) => {
		// Set timeout for the request
		req.setTimeout(limit, () => {
			res.status(408).json({
				error: 'Request Timeout',
				message: 'Request took too long to process. Please try again.',
				status: 408
			});
		});

		// Set response timeout
		res.setTimeout(limit, () => {
			if (!res.headersSent) {
				res.status(408).json({
					error: 'Response Timeout',
					message: 'Response took too long to generate. Please try again.',
					status: 408
				});
			}
		});

		next();
	};
}

// Request size validation middleware
export function validateRequestSize(maxSize = '5mb') {
	return (req, res, next) => {
		const contentLength = parseInt(req.headers['content-length'] || '0', 10);
		const maxSizeBytes = parseSize(maxSize);
		
		if (contentLength > maxSizeBytes) {
			return res.status(413).json({
				error: 'Payload Too Large',
				message: `Request body exceeds maximum size of ${maxSize}`,
				status: 413
			});
		}
		
		next();
	};
}

// Helper function to parse size strings like '5mb', '1gb'
function parseSize(sizeStr) {
	const units = {
		'b': 1,
		'kb': 1024,
		'mb': 1024 * 1024,
		'gb': 1024 * 1024 * 1024
	};
	
	const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
	if (!match) return 5 * 1024 * 1024; // Default to 5MB
	
	const [, value, unit] = match;
	return Math.floor(parseFloat(value) * units[unit]);
}
