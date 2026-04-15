// routes/authRoutes.js
import express from "express";
import {
  login,
  register,
  googleCallback,
  verifyEmailCodigo,
  resendVerification,
} from "../controllers/AuthController.js";
import passport from "../config/passport.js";
import { authLimiter } from "../middlewares/rateLimit.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Usuario from "../models/usuario.js";

const router = express.Router();

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, register);
router.post("/verify-email", authLimiter, verifyEmailCodigo);
router.post("/resend-verification", authLimiter, resendVerification);

router.get("/me", authMiddleware, async (req, res) => {
  const user = await Usuario.findById(req.user.id).select("-password -codigoVerificacion");
  res.json(user);
});


router.get("/google", (req, res, next) => {
  const rol = req.query.rol || "productor";
  req.session.rolPendiente = rol;
  req.session.save((err) => {   // ← guardar sesión de forma síncrona
    if (err) return next(err);
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      prompt: "select_account",
    })(req, res, next);
  });
});

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
      session: false,
    })(req, res, next);
  },
  googleCallback
);

export default router;