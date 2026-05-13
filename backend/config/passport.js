import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import Usuario from '../models/usuario.js'

export const googleAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
)

if (googleAuthConfigured) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let usuario = await Usuario.findOne({ googleId: profile.id })
        if (usuario) return done(null, usuario)

        const emailExistente = await Usuario.findOne({
          email: profile.emails[0].value,
        })

        if (emailExistente) {
          emailExistente.googleId = profile.id
          await emailExistente.save()
          return done(null, emailExistente)
        }

        const rol = req.session.rolPendiente || 'productor'
        const estado = rol === 'comprador' ? 'pendiente' : 'activo'

        usuario = await Usuario.create({
          googleId: profile.id,
          nombre: profile.name.givenName,
          apellido: profile.name.familyName || '',
          email: profile.emails[0].value,
          rol,
          estado,
          password: null,
        })

        req.session.rolPendiente = null
        return done(null, usuario)
      } catch (error) {
        return done(error, null)
      }
    }
  ))
}

export default passport
