import express from "express";
import jwt from "jsonwebtoken";
import CompradorModel from "../models/comprador.js";
import PrecioModel from "../models/precio.js";
import Usuario from "../models/usuario.js";
import { ESTADOS_REVISION_COMPRADOR, esCompradorAprobado } from "../utils/compradorEstado.js";
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
    "el pital": [2.266205, -75.805401],
    "pitalito": [1.8537, -76.0517],
    "acevedo": [1.8043, -75.8893],
    "la argentina": [2.1962, -75.9805],
    "tarqui": [2.1107, -75.8238],
    "suaza": [1.9767, -75.7947],
    "palestina": [1.7238, -76.1347],
    "elias": [2.0131, -75.9395],
    "saladoblanco": [1.9933, -76.0457],
    "isnos": [1.927, -76.2148],
};

function normalizarClaveMunicipio(valor = "") {
    return valor
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function hashDeterministico(texto = "") {
    let hash = 0;
    for (let i = 0; i < texto.length; i += 1) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function generarCoordenadasAproximadas(comprador = {}) {
    const claveMunicipio = normalizarClaveMunicipio(comprador.municipio || "");
    const centro = CENTROS_MUNICIPIO[claveMunicipio] || CENTROS_MUNICIPIO["el pital"];
    const semilla = hashDeterministico(`${comprador.nombreempresa || ""}|${comprador.direccion || ""}|${comprador.municipio || ""}`);
    const offsetLat = ((semilla % 1000) / 1000 - 0.5) * 0.018;
    const offsetLng = (((Math.floor(semilla / 1000)) % 1000) / 1000 - 0.5) * 0.018;

    return {
        latitud: Number((centro[0] + offsetLat).toFixed(6)),
        longitud: Number((centro[1] + offsetLng).toFixed(6)),
        coordenadasEstimadas: true,
    };
}

function construirUbicacionGeneral(comprador = {}) {
    if (comprador.municipio) {
        return `Zona de ${comprador.municipio}`;
    }
    return "Ubicación general disponible";
}

export function sanitizarCompradorPublico(comprador = {}, extras = {}) {
    const tieneCoordenadasExactas =
        Number.isFinite(Number(comprador.latitud)) &&
        Number.isFinite(Number(comprador.longitud));
    const coords = tieneCoordenadasExactas
        ? {
            latitud: Number(comprador.latitud),
            longitud: Number(comprador.longitud),
            coordenadasEstimadas: false,
        }
        : generarCoordenadasAproximadas(comprador);
    return {
        _id: comprador._id,
        nombreempresa: comprador.nombreempresa,
        tipoempresa: comprador.tipoempresa || "independiente",
        municipio: comprador.municipio || null,
        ubicacionGeneral: construirUbicacionGeneral(comprador),
        direccion: null,
        telefono: null,
        horarioApertura: comprador.horarioApertura || null,
        horarioCierre: comprador.horarioCierre || null,
        descripcion: comprador.descripcion || null,
        servicios: Array.isArray(comprador.servicios) ? comprador.servicios : [],
        contactoRestringido: true,
        ...coords,
        ...extras,
    };
}

const authOpcional = (req, res, next) => {
    let token = req.cookies?.auth_token;
    if (!token) {
        token = req.headers.authorization?.split(" ")[1];
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch {
            req.user = null;
        }
    }
    next();
};

router.get("/", authMiddleware, roleMiddleware("admin"), getcompradores);
router.post("/", authMiddleware, roleMiddleware("comprador"), createcomprador);
router.get("/usuario/:usuarioId", authMiddleware, getcompradorByUsuario);
router.get("/mapa", async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const compradoresConUsuario = await CompradorModel.find({
            $or: [
                { estadoRevision: ESTADOS_REVISION_COMPRADOR.APROBADO },
                { estadoRevision: { $exists: false } },
                { estadoRevision: null },
            ],
        })
            .populate("usuario", "estado")
            .select("nombreempresa direccion horarioApertura horarioCierre latitud longitud tipoempresa municipio descripcion servicios estadoRevision usuario")
            .lean();

        const compradores = compradoresConUsuario.filter((comprador) =>
            esCompradorAprobado(comprador.usuario, comprador)
        );

        const preciosRecientes = await PrecioModel.aggregate([
            {
                $match: {
                    comprador: {
                        $in: compradores.map((comprador) => comprador._id),
                    },
                }
            },
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

        const respuesta = compradores.map((comprador) => {
            const precio = preciosPorComprador.get(comprador._id.toString());
            return sanitizarCompradorPublico(comprador, {
                tipo: comprador.tipoempresa || "independiente",
                precioReferencia: precio?.preciocarga ?? null,
                precioKgReferencia: precio?.preciokg ?? null,
                tipocafe: precio?.tipocafe ?? null,
                unidadPrecio: precio?.unidad ?? "carga",
                precioActualizadoAt: precio?.updatedAt ?? null,
            });
        });

        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo mapa", error: error.message });
    }
});

router.get("/:id", authOpcional, async (req, res) => {
    try {
        const comprador = await CompradorModel.findById(req.params.id).populate("usuario", "estado rol");
        if (!comprador) return res.status(404).json({ message: "Comprador no encontrado" });

        const compradorVisible = esCompradorAprobado(comprador.usuario, comprador);

        if (!req.user) {
            if (!compradorVisible) {
                return res.status(404).json({ message: "Comprador no encontrado" });
            }
            return res.json(sanitizarCompradorPublico(comprador));
        }

        const usuarioSolicitante = await Usuario.findById(req.user.id).select("rol");
        const esAdmin = usuarioSolicitante?.rol === "admin";
        const esPropietario = comprador.usuario?._id?.toString() === req.user.id;

        if (!esAdmin && !esPropietario) {
            if (!compradorVisible) {
                return res.status(404).json({ message: "Comprador no encontrado" });
            }
            return res.json(sanitizarCompradorPublico(comprador));
        }

        return res.json(comprador);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener comprador" });
    }
});

router.put("/:id", authMiddleware, updatecomprador);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletecomprador);

export default router;
