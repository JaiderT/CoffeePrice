import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: 'Demasiados intentos. Intenta nuevamente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: 'Demasiadas solicitudes de recuperación. Intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicLimiter = rateLimit ({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Demasiadas solicitudes. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});
