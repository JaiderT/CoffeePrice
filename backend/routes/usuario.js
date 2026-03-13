import express from "express";
import { getusuario } from "../controllers/usuario";
import { updateusuario } from "../controllers/usuario";
import { cambiarpassword } from "../controllers/usuario";
import { eliminarusuario } from "../controllers/usuario";

const router = express.Router();

router.get("/", getusuario);
router.put("/", updateusuario);
router.put("/", cambiarpassword);
router.delete("/", eliminarusuario);

export default router;