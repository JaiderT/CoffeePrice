// routes/authRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import {
  login,
  register,
  googleCallback,
  verifyEmailCodigo,
  resendVerification,
} from "../controllers/AuthController.js";
import passport from "../config/passport.js";
import { loginLimiter, registerLimiter, verifyLimiter, resendVerificationLimiter } from "../middlewares/rateLimit.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Usuario from "../models/usuario.js";

const router = express.Router();

// ─── Autenticación normal ─────────────────────────────────────────
router.post("/login",               loginLimiter,                 login);
router.post("/register",            registerLimiter,              register);
router.post("/verify-email",        verifyLimiter,                verifyEmailCodigo);
router.post("/resend-verification", resendVerificationLimiter,    resendVerification);

// ─── Obtener usuario actual (desde cookie) ────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id)
      .select("-password -codigoVerificacion -codigoVerificacionExpira");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    // Verificar el estado de la cuenta antes de dar acceso
    if (user.estado === "rechazado") {
      return res.status(403).json({ message: "Cuenta rechazada" });
    }
    if (user.estado === "pendiente") {
      return res.status(403).json({ message: "Cuenta pendiente de verificación" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error en /me:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// ─── Generar token JWT desde cookie (para frontend) ────────────────
router.post("/generate-token", authMiddleware, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Verificar que la cuenta esté activa
    if (user.estado === "rechazado") {
      return res.status(403).json({ message: "Cuenta rechazada" });
    }
    
    if (user.estado === "pendiente" && user.rol !== "comprador") {
      return res.status(403).json({ message: "Cuenta pendiente de verificación" });
    }
    
    // Generar nuevo token JWT
    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    
    res.json({ 
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        celular: user.celular
      }
    });
  } catch (error) {
    console.error("Error generando token:", error);
    res.status(500).json({ message: "Error generando token" });
  }
});

// ─── Logout (eliminar cookie) ──────────────────────────────────────
router.post("/logout", (req, res) => {
  // Una sola llamada con las mismas opciones que fijarCookieAuth
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Sesión cerrada exitosamente" });
});


// ─── Google OAuth ──────────────────────────────────────────────────
router.get("/google", (req, res, next) => {
  const rol = req.query.rol || "productor";
  req.session.rolPendiente = rol;
  req.session.save((err) => {
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