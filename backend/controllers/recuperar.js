import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import usuario from "../models/usuario.js";

const transporte = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// funcion de generar codigo de 6 digitos

const generarCodigo =() => {
    return Math.floor(100000 + Math.random()* 900000).toString();
};

// SOLICITAR CODIGO DE RECUPERACION

export const solicitarCodigo = async (req, res) => {
    try {
        const {email} = req.body;

        if (!email) {
            return res.status(400).json({
                message: "El correo electronico es obligatorio"
            });
        }

        //Buscar usuario

        const usuarioEncontrado = await usuario.findOne({email});
            if (!usuarioEncontrado) {
            return res.status(200).json({
                message: "Si el correo está registrado, recibirá un código de verificación"
            });
            }

        const codigo = generarCodigo();

        usuarioEncontrado.codigoRecuperacion = codigo;
        usuarioEncontrado.codigoExpiracion = Date.now() + 900000;
        await usuarioEncontrado.save();


        const mailOptions = {
            from: 'support.coffeprice@gmail.com',
            to: usuarioEncontrado.email,
            subject: 'Codigo de Recuperacion - CoffePrice',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #3D1F0F; margin: 0;">CoffePrice</h2>
            </div>
            
            <h3 style="color: #333;">Recuperacion de Contraseña</h3>
            
            <p>Hola <strong>${usuarioEncontrado.nombre}</strong>,</p>
            
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            
            <p>Tu codigo de verificacion es:</p>
            
            <div style="background: linear-gradient(135deg, #3D1F0F 0%, #7A4020) 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;">
            <h1 style="color: black;
            font-size: 36px;
            letter-spacing: 8px;
            margin: 0;
            font-family: monospace;">
            ${codigo}
            </h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
            Este codigo expira en <strong>15 minutos</strong>.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            </div>
            `

        };

        // Enviar email

        await transporte.sendMail(mailOptions);

        console.log(`Codigo enviado a ${usuarioEncontrado.email}: ${codigo}`);

        res.status(200).json({
            message: "Si el correo esta registrado, recibiras un codigo de verificacion",
        });
    } catch (error) {
        console.error("Error al enviar el codigo", error);
        res.status(500).json({
            message: "Error al procesar la solicitud",
            error: error.message
        });
    }
};

// VERIFICARCODIGO Y CAMBIAR CONTRASEÑA

export const cambiarPassword = async (req, res) => {
    try {
        const { email, codigo, nuevaPassword } = req.body;

        //validaciones

        if (!email || !codigo || !nuevaPassword) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        if (nuevaPassword.length < 8) {
            return res.status(400).json({
                message: "La contraseña debe tener al menos 8 caracteres"
            });
        }
        const usuarioEncontrado = await usuario.findOne({ email });
        if (
            !usuarioEncontrado ||
            usuarioEncontrado.codigoRecuperacion !== codigo ||
            !usuarioEncontrado.codigoExpiracion ||
            usuarioEncontrado.codigoExpiracion < Date.now()
            ) {
            return res.status(400).json({
                message: "Código inválido o expirado"
            });
            }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

        // Actualizar contraseña y limpiar codigo

        usuarioEncontrado.password = hashedPassword;
        usuarioEncontrado.codigoRecuperacion = undefined;
        usuarioEncontrado.codigoExpiracion = undefined;
        await usuarioEncontrado.save();


        // Email de confirmacion

        const mailOptions = {
            from: 'support.coffeprice@gmail.com',
            to: usuarioEncontrado.email,
            subject: 'Contraseña acualizada - CoffePrice',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #3D1F0F, #7A4020);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            margin-bottom: 20px;">
            <span style="color: white; font-size: 30px;">☕️</span>
            </div>
            <h2 style="color: white; margin: 0;">Contraseña Actualizada</h2>
            </div>
            
            <p>Hola <strong>${usuarioEncontrado.nombre}</strong>,</p>
            
            <p>Tu contraseña ha sido actualizada exitosamente.</p>
            
            <p>Ya puedes iniciar sesion con tu nueva contraseña.</p>
            
            <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
            style="background: linear-gradient(to right, #3D1F0F, #7A4020);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;">
            Iniciar Sesion
            </a>
            </div>
            
            <p style="color:#dc2626; font-size: 14px;">
            ⚠️ Si no realizaste este cambio, contacta a soporte inmediatamente.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            </div>
            `

        };

        await transporte.sendMail(mailOptions);

        res.status(200).json({
            message: "Contraseña actualizada exitosamente"
        });

    } catch (error) {
        console.error("Error al cambiar contraseña", error);
        res.status(500).json({
            message: "Error al cambiar contraseña",
            error: error.message
        });
    }
};