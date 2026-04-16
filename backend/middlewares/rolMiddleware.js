const roleMiddleware = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        message: "Acceso denegado, no tienes permisos para esto"
      });
    }
    next();
  };
};

export default roleMiddleware;
