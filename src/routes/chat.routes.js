import { Router } from 'express';
import multer from 'multer';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/text', chatController.handleText);
router.post('/multimodal', upload.single('image'), chatController.handleMultimodal);

export default router;
