import HistorialPrecio from "../models/historialPrecio.js";

export const getHistorial = async (req, res) => {
  try {
    const { compradorId, tipocafe } = req.query;
    const filtro = {};
    if (compradorId) filtro.comprador = compradorId;
    if (tipocafe) filtro.tipocafe = tipocafe;

    const historial = await HistorialPrecio.find(filtro)
      .populate("comprador", "nombreempresa direccion")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial", error: error.message });
  }
};

export const getHistorialByComprador = async (req, res) => {
  try {
    const historial = await HistorialPrecio.find({ comprador: req.params.compradorId })
      .populate("comprador", "nombreempresa")
      .sort({ createdAt: -1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial", error: error.message });
  }
};
