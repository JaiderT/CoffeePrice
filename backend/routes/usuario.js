import express from "express";
import bcrypt from "bcryptjs";
import Usuario from "../models/usuario.js";
import authMiddleware from "../middlewares/authMiddleware.js"
import {
  getusuario,
  updateusuario,
  cambiarpassword,
  eliminarusuario,
} from "../controllers/usuario.js"; 

const router = express.Router();

router.get("/", getusuario);
router.put("/:id/actualizar", updateusuario);
router.put("/:id/password", cambiarpassword);
router.delete("/:id", eliminarusuario);

router.put("/perfil", authMiddleware, async (req, res) => {
  try {
    const { nombre, apellido, celular } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.user.id,
      { nombre, apellido, celular },
      { new: true, runValidators: true }
    ) .select("-password");
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar", error: error.message });
  }
});
router.put("/password", authMiddleware, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    const esValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!esValida) return res.status(400).json({ message: "Contraseña Actual incorrecta"});
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(passwordNueva, salt);
    await usuario.save();
    res.json({ message: "Contraseña Actualizada" });
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar contraseña", error: error.message});
  }
});

export default router;