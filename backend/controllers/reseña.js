import Reseña from "../models/reseña.js";

export const getReseñasByComprador = async (req, res) => {
  try {
    const reseñas = await Reseña.find({ comprador: req.params.compradorId })
      .populate("productor", "nombre apellido")
      .sort({ createdAt: -1 });

    const promedio =
      reseñas.length > 0
        ? reseñas.reduce((acc, r) => acc + r.calificacion, 0) / reseñas.length
        : 0;

    res.json({ promedio: promedio.toFixed(1), total: reseñas.length, reseñas });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas", error: error.message });
  }
};

export const getReseñasByProductor = async (req, res) => {
  try {
    const reseñas = await Reseña.find({ productor: req.params.productorId })
      .populate("comprador", "nombreempresa tipo");

    res.json(reseñas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas del productor", error: error.message });
  }
};

export const createReseña = async (req, res) => {
  try {
    const { productor, comprador, calificacion, comentario, tags } = req.body;

    const reseña = new Reseña({ productor, comprador, calificacion, comentario, tags });
    await reseña.save();

    res.status(201).json(reseña);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Ya has reseñado a este comprador anteriormente" });
    }
    res.status(400).json({ message: "Error al crear reseña", error: error.message });
  }
};

export const updateReseña = async (req, res) => {
  try {
    const { calificacion, comentario, tags } = req.body;

    const reseña = await Reseña.findByIdAndUpdate(
      req.params.id,
      { calificacion, comentario, tags },
      { new: true, runValidators: true }
    );

    if (!reseña) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json(reseña);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar reseña", error: error.message });
  }
};

export const deleteReseña = async (req, res) => {
  try {
    const reseña = await Reseña.findByIdAndDelete(req.params.id); 
    if (!reseña) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json({ message: "Reseña eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar reseña", error: error.message });
  }
};
