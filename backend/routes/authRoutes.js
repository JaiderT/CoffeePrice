// routes/authRoutes.js — versión completa con verificación de email

import express from 'express'
import { login, register, googleCallback, verificarEmail } from "../controllers/AuthController.js"
import passport from '../config/passport.js'
import { authLimiter } from '../middlewares/rateLimit.js'

const router = express.Router()

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, register);

// Nueva ruta de verificación de email (el link del correo llega aquí)
router.get("/verificar-email", verificarEmail);

router.get('/google', (req, res, next) => {
  const rol = req.query.rol || 'productor'
  req.session.rolPendiente = rol
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',
  })(req, res, next)
})

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
      session: false,
    })(req, res, next)
  },
  googleCallback
)

export default router