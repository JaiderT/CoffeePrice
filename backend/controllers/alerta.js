import Alerta from "../models/alerta.js";

export const getAlertasByUsuario = async (req, res) => {
  try {
    const esAdmin = req.user?.rol === "admin";
  const esPropietario = req.user.id === req.params.usuarioId;

  if (!esAdmin && !esPropietario) {
    return res.status(403).json({ message: "No tienes permisos para ver estas alertas" });
  }

    const alertas = await Alerta.find({ usuario: req.params.usuarioId })
      .populate("comprador", "nombreempresa tipo");
    res.json(alertas);
  } catch (error) {
    console.error("[Alerta] Error al obtener alertas:", error.message);
    res.status(500).json({ message: "Error al obtener alertas" });
  }
};

export const getAlertaById = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id)
      .populate("usuario", "nombre apellido")
      .populate("comprador", "nombreempresa");
    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });

    const esAdmin = req.user?.rol === "admin";
    const esPropietario = alerta.usuario._id?.toString?.() === req.user.id || alerta.usuario.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ message: "No tienes permisos para ver esta alerta" });
    }

    res.json(alerta);
  } catch (error) {
    console.error("[Alerta] Error al obtener alerta:", error.message);
    res.status(500).json({ message: "Error al obtener alerta" });
  }
};

export const createAlerta = async (req, res) => {
  try {
    const usuario = req.user.id;
    const { comprador, precioMinimo, canales } = req.body;

    const alerta = new Alerta({ usuario, comprador, precioMinimo, canales });
    await alerta.save();

    res.status(201).json(alerta);
  } catch (error) {
    console.error("[Alerta] Error al crear alerta:", error.message);
    res.status(400).json({ message: "Error al crear alerta" });
  }
};

export const updateAlerta = async (req, res) => {
  try {
    const { precioMinimo, canales, activa, comprador } = req.body;
    const alerta = await Alerta.findById(req.params.id);

    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });

    const esAdmin = req.user?.rol === "admin";
    const esPropietario = alerta.usuario.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ message: "No tienes permisos para actualizar esta alerta" });
    }

    if (precioMinimo !== undefined) alerta.precioMinimo = precioMinimo;
    if (canales !== undefined) alerta.canales = canales;
    if (activa !== undefined) alerta.activa = activa;
    if (comprador !== undefined) alerta.comprador = comprador;

    await alerta.save();
    res.json(alerta);
  } catch (error) {
    console.error("[Alerta] Error al actualizar alerta:", error.message);
    res.status(400).json({ message: "Error al actualizar alerta" });
  }
};

export const toggleAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id);
    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });

    const esAdmin = req.user?.rol === "admin";
    const esPropietario = alerta.usuario.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ message: "No tienes permisos para cambiar esta alerta" });
    }

    alerta.activa = !alerta.activa;
    await alerta.save();

    res.json({ message: `Alerta ${alerta.activa ? "activa" : "desactivada"}`, alerta });
  } catch (error) {
    console.error("[Alerta] Error al cambiar estado de alerta:", error.message);
    res.status(500).json({ message: "Error al cambiar estado de alerta" });
  }
};

export const deleteAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id);
    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });
    const esAdmin = req.user?.rol === "admin";
    const esPropietario = alerta.usuario.toString() === req.user.id;
    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ message: "No tienes permisos para eliminar esta alerta" });
    }
    await alerta.deleteOne();
    res.json({ message: "Alerta eliminada correctamente" });
  } catch (error) {
    console.error("[Alerta] Error al eliminar alerta:", error.message);
    res.status(500).json({ message: "Error al eliminar alerta" });
  }
};
