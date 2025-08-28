import OpenAI from "openai";
import { config } from "../config/index.js";

if (!config.openAiApiKey) {
	// eslint-disable-next-line no-console
	console.warn("OPENAI_API_KEY not set. Set it in your environment.");
}

export const openai = new OpenAI({ apiKey: config.openAiApiKey });


