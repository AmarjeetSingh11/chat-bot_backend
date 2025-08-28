import Joi from "joi";
import sharp from "sharp";
import { openai } from "../services/openaiClient.js";
import { config } from "../config/index.js";

// Custom error classes for better error handling
class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = "ValidationError";
		this.status = 400;
	}
}

class ImageProcessingError extends Error {
	constructor(message) {
		super(message);
		this.name = "ImageProcessingError";
		this.status = 400;
	}
}

class OpenAIApiError extends Error {
	constructor(message, status = 500, retryAfter = null) {
		super(message);
		this.name = "OpenAIApiError";
		this.status = status;
		this.retryAfter = retryAfter;
	}
}

const textSchema = Joi.object({
	message: Joi.string().min(1).max(config.maxMessageLength).required(),
	conversationId: Joi.string().optional(),
	context: Joi.array().items(
		Joi.object({ 
			role: Joi.string().valid("user", "assistant", "system").required(), 
			content: Joi.string().required() 
		})
	).max(50).optional()
});

export async function handleTextChat(req, res, next) {
	try {
		const { error, value } = textSchema.validate(req.body);
		if (error) {
			throw new ValidationError(`Validation failed: ${error.message}`);
		}

		const { message, context = [] } = value;

		if (message.length > config.maxMessageLength) {
			throw new ValidationError(`Message too long. Maximum ${config.maxMessageLength} characters allowed.`);
		}

		const totalContextLength = context.reduce((sum, msg) => sum + msg.content.length, 0);
		if (totalContextLength > config.maxContextLength) {
			throw new ValidationError("Conversation context too long. Please start a new conversation.");
		}

		let response;
		let retryCount = 0;
		const maxRetries = config.maxRetries;

		while (retryCount < maxRetries) {
			try {
				response = await openai.chat.completions.create({
					model: config.openAiTextModel,
					messages: [
						{ role: "system", content: "You are a helpful AI assistant." },
						...context,
						{ role: "user", content: message }
					],
					max_tokens: 1000,
					temperature: 0.7
				});
				break;
			} catch (apiError) {
				retryCount++;
				if (apiError.status === 429) {
					const retryAfter = apiError.headers?.['retry-after'] || 60;
					throw new OpenAIApiError("Rate limit exceeded. Please try again later.", 429, retryAfter);
				}
				if (apiError.status === 400) {
					throw new OpenAIApiError("Invalid request to AI service. Please check your input.", 400);
				}
				if (apiError.status === 401) {
					throw new OpenAIApiError("Authentication failed. Please check API configuration.", 401);
				}
				if (apiError.status === 503) {
					if (retryCount < maxRetries) {
						await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
						continue;
					}
					throw new OpenAIApiError("AI service temporarily unavailable. Please try again later.", 503);
				}
				throw new OpenAIApiError(`AI service error: ${apiError.message}`, apiError.status || 500);
			}
		}

		const ai = response.choices?.[0]?.message?.content ?? "";
		return res.json({ 
			reply: ai, 
			usage: response.usage,
			conversationId: value.conversationId || null
		});
	} catch (err) {
		return next(err);
	}
}

const multimodalSchema = Joi.object({
	message: Joi.string().min(1).max(config.maxMessageLength).required()
});

export async function handleMultimodalChat(req, res, next) {
	try {
		const { error, value } = multimodalSchema.validate(req.body);
		if (error) {
			throw new ValidationError(`Validation failed: ${error.message}`);
		}
		if (!req.file) {
			throw new ValidationError("Image file is required (field name: 'image')");
		}
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(req.file.mimetype)) {
			throw new ValidationError("Only JPEG, PNG, and WebP images are supported");
		}
		if (req.file.size > 5 * 1024 * 1024) {
			throw new ValidationError("Image file too large. Maximum 5MB allowed.");
		}
		if (value.message.length > config.maxMessageLength) {
			throw new ValidationError(`Message too long. Maximum ${config.maxMessageLength} characters allowed.`);
		}

		let compressed;
		try {
			compressed = await sharp(req.file.buffer)
				.resize(1280, 1280, { 
					fit: "inside",
					withoutEnlargement: true 
				})
				.jpeg({ 
					quality: 80,
					progressive: true 
				})
				.toBuffer();
		} catch (sharpError) {
			throw new ImageProcessingError(`Failed to process image: ${sharpError.message}`);
		}

		if (compressed.length > 1024 * 1024) {
			throw new ImageProcessingError("Image too large even after compression. Please use a smaller image.");
		}

		const base64 = compressed.toString("base64");
		const dataUrl = `data:image/jpeg;base64,${base64}`;

		const messages = [
			{ role: "system", content: "You are a helpful AI assistant that can see images." },
			{
				role: "user",
				content: [
					{ type: "text", text: value.message },
					{ type: "image_url", image_url: { url: dataUrl } }
				]
			}
		];

		let result;
		let retryCount = 0;
		const maxRetries = config.maxRetries;

		while (retryCount < maxRetries) {
			try {
				result = await openai.chat.completions.create({
					model: config.openAiMultimodalModel,
					messages,
					max_tokens: 1000,
					temperature: 0.7
				});
				break;
			} catch (apiError) {
				retryCount++;
				if (apiError.status === 429) {
					const retryAfter = apiError.headers?.['retry-after'] || 60;
					throw new OpenAIApiError("Rate limit exceeded. Please try again later.", 429, retryAfter);
				}
				if (apiError.status === 400) {
					throw new OpenAIApiError("Invalid request to AI service. Please check your input.", 400);
				}
				if (apiError.status === 401) {
					throw new OpenAIApiError("Authentication failed. Please check API configuration.", 401);
				}
				if (apiError.status === 503) {
					if (retryCount < maxRetries) {
						await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
						continue;
					}
					throw new OpenAIApiError("AI service temporarily unavailable. Please try again later.", 503);
				}
				throw new OpenAIApiError(`AI service error: ${apiError.message}`, apiError.status || 500);
			}
		}

		const outputText = result.choices?.[0]?.message?.content ?? "";
		return res.json({ 
			reply: outputText,
			imageProcessed: true,
			compressedSize: compressed.length
		});
	} catch (err) {
		return next(err);
	}
}


