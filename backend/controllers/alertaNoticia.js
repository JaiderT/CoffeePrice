import AlertaNoticia from "../models/alertaNoticia.js";

export const getAlertaNoticia = async (req, res) => {
  try {
    const esAdmin = req.user?.rol === 'admin';
    const esPropietario = req.user.id === req.params.usuarioId;
    if (!esAdmin && !esPropietario) {
      return res.status(403).json({ message: "No tienes permisos para ver esta alerta" });
    }
    const alerta = await AlertaNoticia.findOne({ usuario: req.params.usuarioId });
    res.json(alerta || null);
  } catch (error) {
    console.error("[AlertaNoticia] Error al obtener alerta:", error.message);
    res.status(500).json({ message: "Error al obtener alerta" });
  }
};

export const upsertAlertaNoticia = async (req, res) => {
  try {
    const usuario = req.user.id;
    const { categorias, canales, activa } = req.body;
    const alerta = await AlertaNoticia.findOneAndUpdate(
      { usuario },
      { categorias, canales, activa },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(alerta);
  } catch (error) {
    console.error("[AlertaNoticia] Error al guardar alerta:", error.message);
    res.status(400).json({ message: "Error al guardar alerta" });
  }
};

export const deleteAlertaNoticia = async (req, res) => {
  try {
    await AlertaNoticia.findOneAndDelete({ usuario: req.user.id });
    res.json({ message: "Alerta eliminada correctamente" });
  } catch (error) {
    console.error("[AlertaNoticia] Error al eliminar alerta:", error.message);
    res.status(500).json({ message: "Error al eliminar alerta" });
  }
};

export const toggleAlertaNoticia = async (req, res) => {
  try {
    const alerta = await AlertaNoticia.findOne({ usuario: req.user.id });
    if (!alerta) return res.status(404).json({ message: "Alerta no encontrada" });
    alerta.activa = !alerta.activa;
    await alerta.save();
    res.json(alerta);
  } catch (error) {
    console.error("[AlertaNoticia] Error al cambiar estado:", error.message);
    res.status(500).json({ message: "Error al cambiar estado" });
  }
};
