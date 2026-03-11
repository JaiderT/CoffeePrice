import Reseña from "../models/reseña.js";

// @desc    Obtener reseñas de un comprador
// @route   GET /api/resenas/comprador/:compradorId
// @access  Público

export const getReseñasByComprador = async (req, res) => {
  try {
    const reseñas = await Reseña.find({ comprador: req.params,compradorId})
      .populate("caficultor", "nombre apellido")
      .sort({ createdAt: -1 });

    //Calcular calificación promedio
    const promedio =
      reseñas.length > 0
        ? reseñas.reduce((acc, r) => acc + r.calificacion, 0) /
        reseñas.length
        : 0;

    res.json({ promedio: promedio.toFixed(1), total: reseñas.length, reseñas});
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas", error: error.message});
  }
};

// @desc    Obtener reseñas hechas por un caficultor
// @route   GET /api/resenas/caficultor/:caficultorId
// @access  Privado

export const getReseñasByCaficultor = async (req, res) => {
  try {
    const reseñas = await Reseña.find({ caficultor: req.params.caficultorId })
      .populate("comprador", "nombreEmpresa tipo");

    res.json(reseñas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reseñas del caficultor", error: error.message });
  }
};

// @desc    Crear una reseña
// @route   POST /api/resenas
// @access  Privado (rol: caficultor)

export const createReseña = async (req, res) => {
  try {
    const { caficultor, comprador, calificacion, comentario, tags }
    = req.body;
    
    const reseña = new Reseña({ caficultor, comprador, calificacion, comentario, tags });
    await reseña.save(); 

    res.status(201).json(reseña);
  } catch (error) {
    //Error de indice unico: ya se reseño a este comprador
    if (error.code === 11000) {
      return res.status(400).json({ message: "Ya has reseñado a este comprador anteriormente" });
    }
    res.status(400).json({ message: "Error al crear reseña", error: error.message });
  }
};

// @desc    Actualizar una reseña
// @route   PUT /api/resenas/:id
// @access  Privado

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

// @desc    Eliminar una reseña
// @route   DELETE /api/resenas/:id
// @access  Privado

export const deleteResena = async (req, res) => {
  try {
    const resena = await Resena.findByIdAndDelete(req.params.id);
    if (!resena) return res.status(404).json({ mensaje: "Reseña no encontrada" });
    res.json({ mensaje: "Reseña eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar reseña", error: error.message });
  }
};
