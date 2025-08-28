import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import routes from './routes/index.js';

export const logger = pino({ transport: { target: 'pino-pretty' } });

const app = express();

app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

app.use(rateLimit({
	windowMs: 60 * 1000,
	max: 60,
	standardHeaders: true,
	legacyHeaders: false,
}));

app.use(pinoHttp({ logger }));

app.use('/', routes);

// Error handler
app.use((err, _req, res, _next) => {
	const status = err.status || 500;
	res.status(status).json({ error: { message: err.message ?? 'Internal Server Error' } });
});

export default app;
