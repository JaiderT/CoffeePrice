import Configuracion from "../models/configuracion.js";

export const getConfiguracion = async (req, res) => {
  try {
    let config = await Configuracion.findOne();
    if (!config) {
      config = await Configuracion.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener configuración", error: error.message });
  }
};

export const updateConfiguracion = async (req, res) => {
  try {
    const { precioMinimo, precioMaximo, diasHistorial, alertasActivas, registroAbierto, municipios, tiposCafe } = req.body;
    let config = await Configuracion.findOne();
    if (!config) {
      config = new Configuracion({});
    }
    if (precioMinimo !== undefined) config.precioMinimo = precioMinimo;
    if (precioMaximo !== undefined) config.precioMaximo = precioMaximo;
    if (diasHistorial !== undefined) config.diasHistorial = diasHistorial;
    if (alertasActivas !== undefined) config.alertasActivas = alertasActivas;
    if (registroAbierto !== undefined) config.registroAbierto = registroAbierto;
    if (municipios !== undefined) config.municipios = municipios;
    if (tiposCafe !== undefined) config.tiposCafe = tiposCafe;
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar configuración", error: error.message });
  }
};
