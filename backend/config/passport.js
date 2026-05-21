import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import Usuario from '../models/usuario.js'

function construirDatosUsuarioGoogle(profile) {
  const email = profile?.emails?.[0]?.value?.trim().toLowerCase() || null
  const displayName = profile?.displayName?.trim() || ''
  const [nombreDisplay = 'Usuario', ...restoDisplay] = displayName.split(/\s+/).filter(Boolean)

  const nombre = profile?.name?.givenName?.trim() || nombreDisplay || 'Usuario'
  const apellido = profile?.name?.familyName?.trim() || restoDisplay.join(' ').trim() || 'Google'

  return { email, nombre, apellido }
}

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
        const { email, nombre, apellido } = construirDatosUsuarioGoogle(profile)

        if (!email) {
          return done(new Error('Google no devolvio un correo electronico valido.'), null)
        }

        let usuario = await Usuario.findOne({ googleId: profile.id })
        if (usuario) return done(null, usuario)

        const emailExistente = await Usuario.findOne({
          email,
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
          nombre,
          apellido,
          email,
          rol,
          estado,
          password: null,
        })

        req.session.rolPendiente = null
        return done(null, usuario)
      } catch (error) {
        console.error('[GoogleAuth] Error creando/iniciando usuario con Google:', error)
        return done(error, null)
      }
    }
  ))
}

export default passport
