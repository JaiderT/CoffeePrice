import ResenaPlataforma from "../models/resenaPlataforma.js";
import { contieneLenguajeOfensivo } from "../utils/filtroLenguaje.js";

export const getReseñasAprobadas = async (req, res) => {
  try {
    const reseñas = await ResenaPlataforma.find({ aprobada: true })
      .populate("usuario", "nombre apellido rol")
      .sort({ createdAt: -1 });
    res.json(reseñas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas", error: error.message });
  }
};

export const getTodasReseñas = async (req, res) => {
  try {
    const reseñas = await ResenaPlataforma.find()
      .populate("usuario", "nombre apellido rol")
      .sort({ createdAt: -1 });
    res.json(reseñas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas", error: error.message });
  }
};

export const createReseña = async (req, res) => {
  try {
    const { calificacion, comentario, lugar } = req.body;
    if (contieneLenguajeOfensivo(comentario)) {
      return res.status(400).json({ message: "Tu comentario contiene lenguaje ofensivo. Por favor reformúlalo." });
    }

    const yaExiste = await ResenaPlataforma.findOne({ usuario: req.user.id });
    if (yaExiste) {
      return res.status(400).json({ message: "Ya dejaste una reseña de la plataforma" });
    }
    const reseña = new ResenaPlataforma({
      usuario: req.user.id,
      calificacion,
      comentario,
      lugar,
    });
    await reseña.save();
    res.status(201).json({ message: "Reseña enviada, pendiente de aprobación" });
  } catch (error) {
    res.status(400).json({ message: "Error al crear reseña", error: error.message });
  }
};

export const aprobarReseña = async (req, res) => {
  try {
    const reseña = await ResenaPlataforma.findByIdAndUpdate(
      req.params.id,
      { aprobada: true },
      { new: true }
    );
    if (!reseña) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json(reseña);
  } catch (error) {
    res.status(400).json({ message: "Error al aprobar reseña", error: error.message });
  }
};

export const deleteReseña = async (req, res) => {
  try {
    const reseña = await ResenaPlataforma.findByIdAndDelete(req.params.id);
    if (!reseña) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json({ message: "Reseña eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar reseña", error: error.message });
  }
};
