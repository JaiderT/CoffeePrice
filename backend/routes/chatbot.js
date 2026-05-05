import express from 'express';
import { chatWithKaffi } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/', chatWithKaffi);

export default router;
