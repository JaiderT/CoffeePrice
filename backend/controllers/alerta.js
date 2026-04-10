import Alerta from "../models/alerta.js";

export const getAlertasByUsuario = async (req, res) => {
  try {
    const alertas = await Alerta.find({ usuario: req.params.usuarioId })
      .populate("comprador", "nombreempresa tipo");
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener alertas", error: error.message });
  }
};

export const getAlertaById = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id)
      .populate("usuario", "nombre apellido")
      .populate("comprador", "nombreempresa");

    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });
    res.json(alerta);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener alerta", error: error.message });
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
    res.status(400).json({ message: "Error al crear alerta", error: error.message });
  }
};

export const updateAlerta = async (req, res) => {
  try {
    const { precioMinimo, canales, activa, comprador } = req.body;

    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { precioMinimo, canales, activa, comprador },
      { new: true, runValidators: true }
    );

    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });
    res.json(alerta);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar alerta", error: error.message });
  }
};

export const toggleAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id);
    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });

    alerta.activa = !alerta.activa;
    await alerta.save();

    res.json({ message: `Alerta ${alerta.activa ? "activa" : "desactivada"}`, alerta });
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar estado de alerta", error: error.message });
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
    res.status(500).json({ message: "Error al eliminar alerta", error: error.message });
  }
};
