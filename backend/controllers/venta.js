import Venta from "../models/venta.js";

export const getVentasByCafifultor = async (req, res) => {
  try {
    const ventas = await Venta.find({ caficultor: req.params.caficultorId })
      .populate("comprador", "nombreEmpresa tipo direccion")
      .sort({ createdAt: -1 });
    res.json(ventas);  
  } catch (error) {
    res.status(500).json({ message: "Error al obtener ventas", error: error.message });
  }
};

export const getVentasByComprador = async (req, res) => {
  try {
    const ventas = await Venta.find({ comprador: req.params.compradorId })
      .populate("caficultor", "nombre apellido celular")
      .sort({ createdAt: -1 });
    
      res.json(ventas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener ventas del comprador", error: error.message });
  }
};

export const getVentaById = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate("caficultor", "nombre apellido celular")
      .populate("comprador", "nombreEmpresa tipo direccion");
    
      if (!venta) return res.status(404).json({ message: "Venta no encontrada" });
      res.json(venta);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener venta", error: error.message });
  }
};

export const createVenta = async (req, res) => {
  try {
    const { caficultor, comprador, cantidadCargas, precioXCarga, tipoCafe, notas } = req.body;

    const venta = new Venta({ caficultor, comprador, cantidadCargas, precioXCarga, tipoCafe, notas });
    await venta.save(); // pesoKg y totalCOP se calculan en el pre-save

    res.status(201).json(venta);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al registrar venta", error: error.message });
  }
};

export const actualizarEstadoPago = async (req, res) => {
  try {
    const { estadoPago } = req.body;

    const venta = await Venta.findByIdAndUpdate(
      req.params.id,
      { estadoPago },
      { new: true, runValidators: true }
    );

    if (!venta) return res.status(404).json({ mensaje: "Venta no encontrada" });
    res.json({ mensaje: "Estado de pago actualizado", venta });
  } catch (error) {
    res.status(400).json({ mensaje: "Error al actualizar estado de pago", error: error.message });
  }
};

export const deleteVenta = async (req, res) => {
  try {
    const venta = await Venta.findByIdAndDelete(req.params.id);
    if (!venta) return res.status(404).json({ mensaje: "Venta no encontrada" });
    res.json({ mensaje: "Venta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar venta", error: error.message });
  }
};
