import crypto from 'crypto';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const conversations = new Map(); // conversationId -> [{ role, content }]

function getOrCreateConversationId(conversationId) {
	if (conversationId && conversations.has(conversationId)) return conversationId;
	return crypto.randomUUID();
}

function appendMessage(conversationId, message) {
	const list = conversations.get(conversationId) || [];
	list.push(message);
	conversations.set(conversationId, list);
}

function getHistory(conversationId) {
	return conversations.get(conversationId) || [];
}

export async function processText({ conversationId, message, model }) {
	const id = getOrCreateConversationId(conversationId);
	appendMessage(id, { role: 'user', content: message });
	const history = getHistory(id);
	const response = await openai.chat.completions.create({
		model: model || 'gpt-4o-mini',
		messages: history.map(m => ({ role: m.role, content: m.content })),
		temperature: 0.2,
	});
	const answer = response.choices[0]?.message?.content || '';
	appendMessage(id, { role: 'assistant', content: answer });
	return { conversationId: id, message: answer };
}

export async function processMultimodal({ conversationId, message, model, image }) {
	const id = getOrCreateConversationId(conversationId);
	if (message && message.trim().length > 0) {
		appendMessage(id, { role: 'user', content: message });
	}
	const history = getHistory(id);
	const base64 = image.buffer.toString('base64');
	const userParts = [
		{ type: 'text', text: message || 'Analyze this image' },
		{ type: 'input_image', image_data: { data: base64, mime_type: image.mime } },
	];
	const response = await openai.chat.completions.create({
		model: model || 'gpt-4o-mini',
		messages: [
			...history.map(m => ({ role: m.role, content: m.content })),
			{ role: 'user', content: userParts },
		],
		temperature: 0.2,
	});
	const answer = response.choices[0]?.message?.content || '';
	appendMessage(id, { role: 'assistant', content: answer });
	return { conversationId: id, message: answer };
}
