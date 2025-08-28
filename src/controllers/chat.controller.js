import { z } from 'zod';
import * as chatService from '../services/chat.service.js';

const textSchema = z.object({
	conversationId: z.string().optional(),
	message: z.string().min(1),
	model: z.string().optional(),
});

export async function handleText(req, res, next) {
	try {
		const parsed = textSchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({ error: { message: 'Invalid body', details: parsed.error.flatten() } });
			return;
		}
		const { conversationId, message, model } = parsed.data;
		const result = await chatService.processText({ conversationId, message, model });
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function handleMultimodal(req, res, next) {
	try {
		const conversationIdRaw = (req.body?.conversationId ?? '') || undefined;
		const message = ((req.body?.message ?? '') + '').toString();
		const model = ((req.body?.model ?? '') + '').toString() || undefined;

		if (!req.file) {
			res.status(400).json({ error: { message: 'Image file is required (field name: image)' } });
			return;
		}

		const result = await chatService.processMultimodal({
			conversationId: conversationIdRaw,
			message,
			model,
			image: { buffer: req.file.buffer, mime: req.file.mimetype },
		});
		res.json(result);
	} catch (err) {
		next(err);
	}
}
