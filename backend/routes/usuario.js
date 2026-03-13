import express from "express";
import {
  getusuario,
  updateusuario,
  cambiarpassword,
  eliminarusuario,
} from "../controllers/usuario.js"; // ✅ faltaba .js

const router = express.Router();

router.get("/", getusuario);
router.put("/:id/actualizar", updateusuario);
router.put("/:id/password", cambiarpassword); // ✅ era PUT "/" colisionaba
router.delete("/:id", eliminarusuario);

export default router;