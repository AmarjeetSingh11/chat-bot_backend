import { Router } from 'express';
import healthRouter from './health.routes.js';
import chatRouter from './chat.routes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/chat', chatRouter);

export default router;


