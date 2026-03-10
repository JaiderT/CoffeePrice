import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    // Obtener el token del header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Acceso denegado, token no proporcionado" });
    }

    // Verificar el token
    const decoded = jwt.verify(token, "coffeprice_secret");
    req.user = decoded;
    next();

  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export default authMiddleware;
