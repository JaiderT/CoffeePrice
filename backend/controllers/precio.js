import PrecioModel from "../models/precio.js";
import CompradorModel from "../models/comprador.js";
import HistorialPrecio from "../models/historialPrecio.js";
import Alerta from "../models/alerta.js";
import Usuario from "../models/usuario.js";
import { enviarAlertaPrecio, enviarNotificacionPrecio } from "../services/emailService.js";

const verificarAlertas = async (compradorId, preciocarga) => {
  try {
    const alertas = await Alerta.find({
      $or: [
        { comprador: compradorId },
        { comprador: null }
      ],
      activa: true,
      precioMinimo: { $lte: preciocarga }
    }).populate('usuario', 'nombre apellido email')
      .populate('comprador', 'nombreempresa');

    for (const alerta of alertas) {
      await Alerta.findByIdAndUpdate(alerta._id, {
        ultimaNotificacion: new Date()
      });
      if (alerta.canales?.email && alerta.usuario?.email) {
        await enviarAlertaPrecio({
          destinatario: alerta.usuario.email,
          nombreUsuario: `${alerta.usuario.nombre} ${alerta.usuario.apellido}`,
          nombreComprador: alerta.comprador?.nombreempresa || 'Un comprador',
          precioMinimo: alerta.precioMinimo,
          precioActual: preciocarga,
        });
      }
    }
    return alertas;
  } catch (error) {
    console.error('Error verificando alertas:', error);
    return [];
  }
};

const notificarProductores = async (compradorNombre, precio, accion) => {
  try {
    const productores = await Usuario.find({
      rol: 'productor',
      estado: 'activo',
      email: { $exists: true, $ne: null }
    }).select('nombre apellido email');

    for (const productor of productores) {
      await enviarNotificacionPrecio({
        destinatario: productor.email,
        nombreUsuario: `${productor.nombre} ${productor.apellido}`,
        nombreComprador: compradorNombre,
        preciocarga: precio.preciocarga,
        preciokg: precio.preciokg,
        tipocafe: precio.tipocafe,
        accion,
      });
    }
    console.log(`✅ Notificados ${productores.length} productores`);
  } catch (error) {
    console.error('Error al notificar productores:', error.message);
  }
};

export const getprecios = async (req, res) => {
  try {
    const { tipocafe } = req.query;
    const filtro = tipocafe ? { tipocafe } : {};

    const precios = await PrecioModel.find(filtro)
      .populate("comprador", "nombreempresa direccion")
      .sort({ preciocarga: -1 });

    const vistos = new Set();
    const preciosPorComprador = precios.filter(p => {
      const key = p.comprador?._id?.toString();
      if (!key || vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

    res.json(preciosPorComprador);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener precios", error: error.message });
  }
};

export const getpreciosBycomprador = async (req, res) => {
  try {
    const precios = await PrecioModel.find({ comprador: req.params.compradorId })
      .populate("comprador", "nombreempresa")
      .sort({ createdAt: -1 });
    res.json(precios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener precios del comprador", error: error.message });
  }
};

export const createprecio = async (req, res) => {
  try {
    const { comprador, preciocarga, tipocafe } = req.body;

    if (!comprador || preciocarga === undefined || !tipocafe) {
      return res.status(400).json({
        message: "Comprador, precio por carga y tipo de café son obligatorios"
      });
    }

    const precioNumerico = Number(preciocarga);
    const tiposPermitidos = ["pergamino_seco", "especial", "organico", "verde", "pasilla", "cacao", "limon"];

    if (Number.isNaN(precioNumerico) || precioNumerico <= 0) {
      return res.status(400).json({
        message: "El precio por carga debe ser un número mayor a 0"
      });
    }

    if (!tiposPermitidos.includes(tipocafe)) {
      return res.status(400).json({ message: "Tipo de café no válido" });
    }

    const compradorExistente = await CompradorModel.findById(comprador);
    if (!compradorExistente) {
      return res.status(404).json({ message: "Comprador no encontrado" });
    }

    const esAdmin = req.user?.rol === "admin";
    const esPropietario = compradorExistente.usuario.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({
        message: "No tienes permisos para crear precios para este comprador"
      });
    }

    const nuevoPrecio = new PrecioModel({
      comprador,
      preciocarga: precioNumerico,
      tipocafe
    });

    await nuevoPrecio.save();
    await HistorialPrecio.create({
      comprador,
      preciocarga: precioNumerico,
      preciokg: nuevoPrecio.preciokg,
      tipocafe,
    });
    await verificarAlertas(comprador, precioNumerico);
    // Notificar a todos los productores activos
    notificarProductores(compradorExistente.nombreempresa, nuevoPrecio, 'nuevo').catch(console.error);

    res.status(201).json(nuevoPrecio);
  } catch (error) {
    res.status(400).json({ message: "Error al crear precio", error: error.message });
  }
};

export const updateprecio = async (req, res) => {
  try {
    const { preciocarga, tipocafe } = req.body;

    const precio = await PrecioModel.findById(req.params.id);
    if (!precio) {
      return res.status(404).json({ message: "Precio no encontrado" });
    }

    const compradorExistente = await CompradorModel.findById(precio.comprador);
    if (!compradorExistente) {
      return res.status(404).json({ message: "Comprador asociado no encontrado" });
    }

    const esAdmin = req.user?.rol === "admin";
    const esPropietario = compradorExistente.usuario.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({
        message: "No tienes permisos para actualizar este precio"
      });
    }

    if (preciocarga !== undefined) {
      const precioNumerico = Number(preciocarga);
      if (Number.isNaN(precioNumerico) || precioNumerico <= 0) {
        return res.status(400).json({
          message: "El precio por carga debe ser un número mayor a 0"
        });
      }
      precio.preciocarga = precioNumerico;
    }

    if (tipocafe !== undefined) {
      const tiposPermitidos = ["pergamino_seco", "especial", "organico", "verde", "pasilla", "cacao", "limon"];
      if (!tiposPermitidos.includes(tipocafe)) {
        return res.status(400).json({ message: "Tipo de café no válido" });
      }
      precio.tipocafe = tipocafe;
    }

    await precio.save();
    await HistorialPrecio.create({
      comprador: precio.comprador,
      preciocarga: precio.preciocarga,
      preciokg: precio.preciokg,
      tipocafe: precio.tipocafe,
    });
    await verificarAlertas(precio.comprador, precio.preciocarga);
    // Notificar a todos los productores activos
    notificarProductores(compradorExistente.nombreempresa, precio, 'actualizado').catch(console.error);

    res.json(precio);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar precio", error: error.message });
  }
};

export const deleteprecio = async (req, res) => {
  try {
    const precio = await PrecioModel.findById(req.params.id);
    if (!precio) {
      return res.status(404).json({ message: "Precio no encontrado" });
    }

    const compradorExistente = await CompradorModel.findById(precio.comprador);
    if (!compradorExistente) {
      return res.status(404).json({ message: "Comprador asociado no encontrado" });
    }

    const esAdmin = req.user?.rol === "admin";
    const esPropietario = compradorExistente.usuario.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.status(403).json({
        message: "No tienes permisos para eliminar este precio"
      });
    }

    await precio.deleteOne();
    res.json({ message: "Precio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar precio", error: error.message });
  }
};
