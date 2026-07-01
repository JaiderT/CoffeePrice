import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import {
  login,
  register,
  googleCallback,
  verifyEmailCodigo,
  resendVerification,
  reactivarCuenta,
} from "../controllers/AuthController.js";
import passport, { googleAuthConfigured } from "../config/passport.js";
import { loginLimiter, registerLimiter, verifyLimiter, resendVerificationLimiter } from "../middlewares/rateLimit.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Usuario from "../models/usuario.js";
import { construirOpcionesCookie, limpiarCookieAuth } from "../utils/cookieOptions.js";

const router = express.Router();
const isProduction = process.env.NODE_ENV === "production";

const googleSessionMiddleware = session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "coffeprice-google-session",
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 60 * 15,
    autoRemove: "native",
    stringify: false,
  }),
  cookie: construirOpcionesCookie({ maxAge: 1000 * 60 * 15 }),
});

router.post("/login", loginLimiter, login);
router.post("/register", registerLimiter, register);
router.post("/verify-email", verifyLimiter, verifyEmailCodigo);
router.post("/resend-verification", resendVerificationLimiter, resendVerification);
router.post("/reactivar-cuenta", loginLimiter, reactivarCuenta);
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id)
      .select("-password -codigoVerificacion -codigoVerificacionExpira -codigoRecuperacion -codigoExpiracion");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    if (user.estado === "rechazado") {
      return res.status(403).json({ message: "Cuenta rechazada" });
    }
    if (user.estado === "eliminado") {
      return res.status(403).json({ message: "Esta cuenta ha sido eliminada." });
    }
    if (user.estado === "pendiente" && user.rol !== "comprador") {
      return res.status(403).json({ message: "Cuenta pendiente de verificación" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error en /me:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

router.post("/logout", (req, res) => {
  req.session?.destroy(() => {});
  limpiarCookieAuth(res, "auth_token");
  limpiarCookieAuth(res, "connect.sid");
  res.set("Cache-Control", "no-store");
  res.json({ message: "Sesión cerrada exitosamente" });
});

function responderGoogleNoDisponible(res) {
  return res.status(503).json({
    message: "El inicio de sesión con Google no está configurado en este entorno.",
  });
}

router.get("/google", googleSessionMiddleware, (req, res, next) => {
  if (!googleAuthConfigured) {
    return responderGoogleNoDisponible(res);
  }

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
  googleSessionMiddleware,
  (req, res, next) => {
    if (!googleAuthConfigured) {
      return responderGoogleNoDisponible(res);
    }

    passport.authenticate("google", { session: false }, (err, user) => {
      if (err) {
        console.error("[GoogleAuth] Error en callback:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
      }

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
      }

      req.user = user;
      return next();
    })(req, res, next);
  },
  googleCallback
);

export default router;
