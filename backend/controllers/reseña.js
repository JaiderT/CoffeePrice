import Reseña from "../models/reseña.js";

export const getResenasByComprador = async (req, res) => {
  try {
    const resenas = await Reseña.find({ comprador: req.params.compradorId })
      .populate("caficultor", "nombre apellido")
      .sort({ createdAt: -1 });

    const promedio =
      resenas.length > 0
        ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length
        : 0;

    res.json({ promedio: promedio.toFixed(1), total: resenas.length, resenas });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas", error: error.message });
  }
};

export const getResenasByCaficultor = async (req, res) => {
  try {
    const resenas = await Reseña.find({ caficultor: req.params.caficultorId })
      .populate("comprador", "nombreEmpresa tipo");

    res.json(resenas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas del caficultor", error: error.message });
  }
};

export const createResena = async (req, res) => {
  try {
    const { caficultor, comprador, calificacion, comentario, tags } = req.body;

    const resena = new Reseña({ caficultor, comprador, calificacion, comentario, tags });
    await resena.save();

    res.status(201).json(resena);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Ya has reseñado a este comprador anteriormente" });
    }
    res.status(400).json({ message: "Error al crear reseña", error: error.message });
  }
};

export const updateResena = async (req, res) => {
  try {
    const { calificacion, comentario, tags } = req.body;

    const resena = await Reseña.findByIdAndUpdate(
      req.params.id,
      { calificacion, comentario, tags },
      { new: true, runValidators: true }
    );

    if (!resena) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json(resena);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar reseña", error: error.message });
  }
};

export const deleteResena = async (req, res) => {
  try {
    const resena = await Reseña.findByIdAndDelete(req.params.id); // ✅ era Resena sin importar
    if (!resena) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json({ message: "Reseña eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar reseña", error: error.message });
  }
};
