import ResenaPlataforma from "../models/resenaPlataforma.js";

export const getResenasAprobadas = async (req, res) => {
  try {
    const resenas = await ResenaPlataforma.find({ aprobada: true })
      .populate("usuario", "nombre apellido rol")
      .sort({ createdAt: -1 });
    res.json(resenas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas", error: error.message });
  }
};

export const getTodasResenas = async (req, res) => {
  try {
    const resenas = await ResenaPlataforma.find()
      .populate("usuario", "nombre apellido rol")
      .sort({ createdAt: -1 });
    res.json(resenas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas", error: error.message });
  }
};

export const createResena = async (req, res) => {
  try {
    const { calificacion, comentario, lugar } = req.body;
    const yaExiste = await ResenaPlataforma.findOne({ usuario: req.user.id });
    if (yaExiste) {
      return res.status(400).json({ message: "Ya dejaste una reseña de la plataforma" });
    }
    const resena = new ResenaPlataforma({
      usuario: req.user.id,
      calificacion,
      comentario,
      lugar,
    });
    await resena.save();
    res.status(201).json({ message: "Reseña enviada, pendiente de aprobación" });
  } catch (error) {
    res.status(400).json({ message: "Error al crear reseña", error: error.message });
  }
};

export const aprobarResena = async (req, res) => {
  try {
    const resena = await ResenaPlataforma.findByIdAndUpdate(
      req.params.id,
      { aprobada: true },
      { new: true }
    );
    if (!resena) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json(resena);
  } catch (error) {
    res.status(400).json({ message: "Error al aprobar reseña", error: error.message });
  }
};

export const deleteResena = async (req, res) => {
  try {
    const resena = await ResenaPlataforma.findByIdAndDelete(req.params.id);
    if (!resena) return res.status(404).json({ message: "Reseña no encontrada" });
    res.json({ message: "Reseña eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar reseña", error: error.message });
  }
};
