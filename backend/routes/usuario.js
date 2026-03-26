import express from "express";
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

export default router;