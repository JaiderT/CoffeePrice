import Prediccion from "../models/prediccion.js"

// obtener todas las predicciones

export const getPredicciones = async (req, res) => {
    try {
        const predicciones = await Prediccion.find().sort({ fecha: -1});
        res.json(predicciones);
    } catch (error) {
        res.status(500).json({message: "Error al obtener predicciones", error:error.message});
    }
};

//obtener la prediccion mas reciente

export const getUltimaPrediccion = async (req, res) => {
    try {
        const prediccion = await Prediccion.findOne().sort({ fecha: -1 });
        if (!prediccion) return res.status(404).json({message: "No hay predicciones disponibles"});
        res.json(prediccion);
    } catch (error) {
        res.status(500).json({message: "Error al obtener ultima prediccion", error: error.message});
    }
};

// @desc    Obtener una predicción por ID
// @route   GET /api/predicciones/:id
// @access  Público
/*export const getPrediccionById = async (req, res) => {
    try {
      const prediccion = await Prediccion.findById(req.params.id);
      if (!prediccion) return res.status(404).json({ mensaje: "Predicción no encontrada" });
      res.json(prediccion);
    } catch (error) {
      res.status(500).json({ mensaje: "Error al obtener predicción", error: error.message });
    }
  };*/


// crear una prediccion

export const  createPrediccion = async (req, res) => {
    try {
        const { fecha, precioestimado, preciominimo, preciomaximo, tendencia, confianza } = req.body;

        const prediccion = new Prediccion({
            fecha,
            precioestimado,
            preciominimo,
            preciomaximo,
            tendencia,
            confianza,
        });

        await prediccion.save();
        res.status(201).json(prediccion);
    } catch (error) {
        res.status(400).json({message: "Error al crear prediccion", error: error.message});
    }
};

// actualizar una prediccion

export const updatePrediccion = async (req, res) => {
    try {
        const { fecha, precioestimado, preciominimo, preciomaximo, tendencia, confianza } = req.body;

        const prediccion = await Prediccion.findByIdAndUpdate(
            req.params.id,
            { fecha, precioestimado, preciominimo, preciomaximo, tendencia, confianza },
            { new: true, runValidators: true } 
        );

        if (!prediccion) return res.status(404).json({message: "Prediccion no encontrada"});
        res.jason(prediccion);
    } catch (error) {
        res.status(400).json({message: "Error al actualizar prediccion", error: error.message});
    }
};

// eliminar una prediccion

export const deletePrediccion = async (req, res) => {
    try {
        const prediccion = await Prediccion.findByIdAndDelete(req.params.id);
        if (!prediccion) return res.status(404).json({message: "Prediccion no encontrada"});
        res.json({message: "Prediccion eliminada correctamente"});
    } catch (error) {
        res.status(500).json({message: "Error al eliminar prediccion", error: error.message});
    }
};