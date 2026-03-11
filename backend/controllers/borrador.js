import Alerta from "../models/Alerta.js";

// @desc    Obtener alertas de un usuario
// @route   GET /api/alertas/usuario/:usuarioId
// @access  Privado
export const getAlertasByUsuario = async (req, res) => {
  try {
    const alertas = await Alerta.find({ usuario: req.params.usuarioId })
      .populate("comprador", "nombreEmpresa tipo");

    res.json(alertas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener alertas", error: error.message });
  }
};

// @desc    Obtener una alerta por ID
// @route   GET /api/alertas/:id
// @access  Privado
export const getAlertaById = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id)
      .populate("usuario", "nombre apellido")
      .populate("comprador", "nombreEmpresa");

    if (!alerta) return res.status(404).json({ mensaje: "Alerta no encontrada" });
    res.json(alerta);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener alerta", error: error.message });
  }
};

// @desc    Crear una alerta
// @route   POST /api/alertas
// @access  Privado
export const createAlerta = async (req, res) => {
  try {
    const { usuario, comprador, precioMinimo, canales } = req.body;

    const alerta = new Alerta({ usuario, comprador, precioMinimo, canales });
    await alerta.save();

    res.status(201).json(alerta);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al crear alerta", error: error.message });
  }
};

// @desc    Actualizar una alerta
// @route   PUT /api/alertas/:id
// @access  Privado
export const updateAlerta = async (req, res) => {
  try {
    const { precioMinimo, canales, activa, comprador } = req.body;

    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { precioMinimo, canales, activa, comprador },
      { new: true, runValidators: true }
    );

    if (!alerta) return res.status(404).json({ mensaje: "Alerta no encontrada" });
    res.json(alerta);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al actualizar alerta", error: error.message });
  }
};

// @desc    Activar / desactivar alerta
// @route   PUT /api/alertas/:id/toggle
// @access  Privado
export const toggleAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findById(req.params.id);
    if (!alerta) return res.status(404).json({ mensaje: "Alerta no encontrada" });

    alerta.activa = !alerta.activa;
    await alerta.save();

    res.json({ mensaje: `Alerta ${alerta.activa ? "activada" : "desactivada"}`, alerta });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cambiar estado de alerta", error: error.message });
  }
};

// @desc    Eliminar una alerta
// @route   DELETE /api/alertas/:id
// @access  Privado
export const deleteAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findByIdAndDelete(req.params.id);
    if (!alerta) return res.status(404).json({ mensaje: "Alerta no encontrada" });
    res.json({ mensaje: "Alerta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar alerta", error: error.message });
  }
};
