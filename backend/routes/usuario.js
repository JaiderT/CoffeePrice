import express from "express";
import bcrypt from "bcryptjs";
import Usuario from "../models/usuario.js";
import authMiddleware from "../middlewares/authMiddleware.js"
import {
  getusuario,
  updateusuario,
  cambiarpassword,
  eliminarusuario,
  eliminarMiCuenta,
  cambiarestado,
} from "../controllers/usuario.js"; 
import rolMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

router.get("/", authMiddleware, rolMiddleware("admin"), getusuario);
router.put("/:id/estado", authMiddleware, rolMiddleware("admin"), cambiarestado);

router.put("/perfil", authMiddleware, async (req, res) => {
  try {
    const { nombre, apellido, celular } = req.body;

    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!nombre || !soloLetras.test(nombre.trim())) {
      return res.status(400).json({ message: "El nombre solo puede contener letras" });
    }
    if (!apellido || !soloLetras.test(apellido.trim())) {
      return res.status(400).json({ message: "El apellido solo puede contener letras" });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.user.id,
      { nombre, apellido, celular },
      { new: true, runValidators: true }
    ).select("-password");

    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    console.error("[Usuario] Error al actualizar perfil:", error.message);
    res.status(400).json({ message: "Error al actualizar" });
  }
});
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const { passwordactual, passwordnueva } = req.body;
    if (!PASSWORD_REGEX.test(passwordnueva)) {
      return res.status(400).json({
        message: "La contraseña debe tener mínimo 10 caracteres, una mayúscula, una minúscula y un número"
      });
    }
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    const esValida = await bcrypt.compare(passwordactual, usuario.password);
    if (!esValida) return res.status(400).json({ message: "Contraseña Actual incorrecta"});
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(passwordnueva, salt);
    await usuario.save();
    res.json({ message: "Contraseña Actualizada" });
  } catch (error) {
    console.error("[Usuario] Error al cambiar contraseña:", error.message);
    res.status(500).json({ message: "Error al cambiar contraseña"});
  }
});
router.delete("/perfil", authMiddleware, eliminarMiCuenta);

router.put("/:id/actualizar", authMiddleware, rolMiddleware("admin"), updateusuario);
router.put("/:id/password", authMiddleware, rolMiddleware("admin"), cambiarpassword);
router.delete("/:id", authMiddleware, rolMiddleware("admin"), eliminarusuario);

export default router;
