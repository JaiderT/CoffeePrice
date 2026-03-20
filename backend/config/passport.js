import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20' // ← corregido
import Usuario from '../models/usuario.js'

passport.use(new GoogleStrategy(
  {
    clientID:          process.env.GOOGLE_CLIENT_ID,
    clientSecret:      process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:       process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true, // ← necesario para leer req.session
  },
  async (req, accessToken, refreshToken, profile, done) => { // ← agregar req
    try {
      // Ya existe por googleId
      let usuario = await Usuario.findOne({ googleId: profile.id })
      if (usuario) return done(null, usuario)

      // Ya existe por email
      const emailExistente = await Usuario.findOne({
        email: profile.emails[0].value
      })
      if (emailExistente) {
        emailExistente.googleId = profile.id
        await emailExistente.save()
        return done(null, emailExistente)
      }

      // Usuario nuevo — leer rol elegido antes de redirigir a Google
      const rol    = req.session.rolPendiente || 'productor'
      const estado = rol === 'comprador' ? 'pendiente' : 'activo'

      usuario = await Usuario.create({
        googleId: profile.id,
        nombre:   profile.name.givenName,
        apellido: profile.name.familyName || '',
        email:    profile.emails[0].value,
        rol,
        estado,
        password: null,
      })

      req.session.rolPendiente = null
      return done(null, usuario)

    } catch (error) {
      return done(error, null) // ← siempre retornar el error
    }
  }
))

export default passport