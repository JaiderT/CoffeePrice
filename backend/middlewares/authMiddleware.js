import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // 📌 PRIORIDAD: Primero buscar token en cookie
    let token = req.cookies?.auth_token;
    
    // Si no hay cookie, buscar en header Authorization
    if (!token) {
      token = req.headers.authorization?.split(" ")[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: "Acceso denegado, token no proporcionado" });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export default authMiddleware;
