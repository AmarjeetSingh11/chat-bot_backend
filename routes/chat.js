import { Router } from "express";
import multer from "multer";
import { handleTextChat, handleMultimodalChat } from "../controller/chatController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.post("/text", handleTextChat);
router.post("/multimodal", upload.single("image"), handleMultimodalChat);

export default router;


