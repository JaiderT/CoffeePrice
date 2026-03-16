import express from 'express';
import { register } from "../controllers/AuthController.js";

const router = express.Router();

router.post("/", register); // ✅ era "/register" → quedaba /api/auth/register/register

export default router;