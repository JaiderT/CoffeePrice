import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Demasiados intentos de inicio de sesion. Intenta nuevamente mas tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Demasiados registros. Intenta nuevamente mas tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: {
    message: 'Demasiados intentos de verificacion. Intenta mas tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 4,
  message: {
    message: 'Espera un momento antes de solicitar otro codigo.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: 'Demasiadas solicitudes de recuperacion. Intenta mas tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Demasiadas solicitudes. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});
