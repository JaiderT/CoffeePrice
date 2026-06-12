import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.js";

export function rutaPermitidaParaEstado(req, estado, rol) {
  const ruta = req.originalUrl || req.url || "";

  if (ruta.startsWith("/api/auth/logout") || ruta.startsWith("/api/auth/me")) {
    return true;
  }

  if (estado === "suspendido" && ruta.startsWith("/api/usuario/reactivar")) {
    return true;
  }

  if (estado === "pendiente" && rol === "comprador") {
    return (
      ruta.startsWith("/api/comprador") ||
      ruta.startsWith("/api/auth/me") ||
      ruta.startsWith("/api/auth/logout")
    );
  }

  return false;
}

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.auth_token;

    if (!token) {
      token = req.headers.authorization?.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Acceso denegado, token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select("_id rol estado");

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado o sesión inválida" });
    }

    if (
      ["rechazado", "eliminado", "suspendido"].includes(usuario.estado) &&
      !rutaPermitidaParaEstado(req, usuario.estado, usuario.rol)
    ) {
      return res.status(403).json({
        message: usuario.estado === "suspendido"
          ? "Tu cuenta esta suspendida. Reactivala o contacta al administrador."
          : "Tu cuenta no tiene acceso a esta accion.",
      });
    }

    if (
      usuario.estado === "pendiente" &&
      !rutaPermitidaParaEstado(req, usuario.estado, usuario.rol)
    ) {
      return res.status(403).json({
        message: "Tu cuenta aun no puede acceder a esta accion.",
      });
    }

    req.user = {
      id: usuario._id.toString(),
      rol: usuario.rol,
      estado: usuario.estado,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export default authMiddleware;
