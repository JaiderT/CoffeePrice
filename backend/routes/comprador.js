import express from "express";
import jwt from "jsonwebtoken"; // ← NUEVO
import CompradorModel from "../models/comprador.js";
import PrecioModel from "../models/precio.js";
import Usuario from "../models/usuario.js";
import {
  getcompradores,
  createcomprador,
  updatecomprador,
  deletecomprador,
  getcompradorByUsuario,
} from "../controllers/comprador.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/rolMiddleware.js";

const router = express.Router();

const CENTROS_MUNICIPIO = {
    'el pital': [2.266205, -75.805401],
    'pitalito': [1.8537, -76.0517],
    'acevedo': [1.8043, -75.8893],
    'la argentina': [2.1962, -75.9805],
    'tarqui': [2.1107, -75.8238],
    'suaza': [1.9767, -75.7947],
    'palestina': [1.7238, -76.1347],
    'elias': [2.0131, -75.9395],
    'saladoblanco': [1.9933, -76.0457],
    'isnos': [1.927, -76.2148],
};

function normalizarClaveMunicipio(valor = '') {
    return valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function hashDeterministico(texto = '') {
    let hash = 0;
    for (let i = 0; i < texto.length; i += 1) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function generarCoordenadasAproximadas(comprador = {}) {
    const claveMunicipio = normalizarClaveMunicipio(comprador.municipio || '');
    const centro = CENTROS_MUNICIPIO[claveMunicipio] || CENTROS_MUNICIPIO['el pital'];
    const semilla = hashDeterministico(`${comprador.nombreempresa || ''}|${comprador.direccion || ''}|${comprador.municipio || ''}`);
    const offsetLat = ((semilla % 1000) / 1000 - 0.5) * 0.018;
    const offsetLng = (((Math.floor(semilla / 1000)) % 1000) / 1000 - 0.5) * 0.018;

    return {
        latitud: Number((centro[0] + offsetLat).toFixed(6)),
        longitud: Number((centro[1] + offsetLng).toFixed(6)),
        coordenadasEstimadas: true,
    };
}

// ← NUEVO: middleware opcional que no bloquea si no hay token
const authOpcional = (req, res, next) => {
    let token = req.cookies?.auth_token;
    if (!token) {
        token = req.headers.authorization?.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch { /* token inválido → anónimo */ }
    }
    next();
};

router.get("/", authMiddleware, roleMiddleware("admin"), getcompradores);
router.post("/", authMiddleware, roleMiddleware("comprador"), createcomprador);
router.get("/usuario/:usuarioId", authMiddleware, getcompradorByUsuario);
router.get("/mapa", async (req, res) => {
    try {
        const compradores = await CompradorModel.find({})
        .select("nombreempresa direccion telefono horarioApertura horarioCierre latitud longitud tipoempresa municipio descripcion servicios")
        .lean();

        const preciosRecientes = await PrecioModel.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$comprador",
                    preciocarga: { $first: "$preciocarga" },
                    preciokg: { $first: "$preciokg" },
                    tipocafe: { $first: "$tipocafe" },
                    unidad: { $first: "$unidad" },
                    updatedAt: { $first: "$updatedAt" },
                }
            }
        ]);

        const preciosPorComprador = new Map(
            preciosRecientes.map((precio) => [precio._id?.toString(), precio])
        );

        const respuesta = compradores
            .map((comprador) => {
                const precio = preciosPorComprador.get(comprador._id.toString());
                const tieneCoordsReales = Number.isFinite(comprador.latitud) && Number.isFinite(comprador.longitud);
                const coords = tieneCoordsReales
                    ? {
                        latitud: comprador.latitud,
                        longitud: comprador.longitud,
                        coordenadasEstimadas: false,
                    }
                    : generarCoordenadasAproximadas(comprador);
                return {
                    ...comprador,
                    ...coords,
                    tipo: comprador.tipoempresa || "independiente",
                    precioReferencia: precio?.preciocarga ?? null,
                    precioKgReferencia: precio?.preciokg ?? null,
                    tipocafe: precio?.tipocafe ?? null,
                    unidadPrecio: precio?.unidad ?? "carga",
                    precioActualizadoAt: precio?.updatedAt ?? null,
                };
            });

        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo mapa", error: error.message });
    }
});

router.get('/:id', authOpcional, async (req, res) => { // ← authOpcional agregado
  try {
    const comprador = await CompradorModel.findById(req.params.id);
    if (!comprador) return res.status(404).json({ message: 'Comprador no encontrado' });

    if (!req.user) {
      return res.json({
        _id: comprador._id,
        nombreempresa: comprador.nombreempresa,
        direccion: comprador.direccion,
        telefono: comprador.telefono,
        horarioApertura: comprador.horarioApertura,
        horarioCierre: comprador.horarioCierre,
        latitud: comprador.latitud,
        longitud: comprador.longitud,
      });
    }

    const usuarioSolicitante = await Usuario.findById(req.user.id).select("rol");
    const esAdmin = usuarioSolicitante?.rol === "admin";
    const esPropietario = comprador.usuario?.toString() === req.user.id;

    if (!esAdmin && !esPropietario) {
      return res.json({
        _id: comprador._id,
        nombreempresa: comprador.nombreempresa,
        direccion: comprador.direccion,
        telefono: comprador.telefono,
        horarioApertura: comprador.horarioApertura,
        horarioCierre: comprador.horarioCierre,
        latitud: comprador.latitud,
        longitud: comprador.longitud,
      });
    }

    return res.json(comprador);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener comprador' });
  }
});

router.put("/:id", authMiddleware, updatecomprador);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletecomprador);

export default router;
