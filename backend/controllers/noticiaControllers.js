import Noticia from "../models/noticia.js";
import { asegurarNoticiasRecientes, limpiarNoticiasDanadas } from "../services/noticiaAutoService.js";
import AlertaNoticia from "../models/alertaNoticia.js";
import { enviarAlertaNoticia } from "../services/emailService.js";

export const getNoticias = async (req, res) => {
    try {
        const { categoria } = req.query;
        const filtro = categoria ? { categoria } : {};

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');

        await asegurarNoticiasRecientes();

        const noticias = await Noticia.find(filtro).sort({ publishedAt: -1, createdAt: -1 });
        res.json(noticias);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener noticias", error: error.message });
    }
};

export const getNoticiaById = async (req, res) => {
    try {
        const noticia = await Noticia.findById(req.params.id);
        if (!noticia) return res.status(404).json({ message: "Noticia no encontrada" });
        res.json(noticia);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener noticia", error: error.message });
    }
};

export const createNoticia = async (req, res) => {
    try {
        const { titulo, resumen, contenido, categoria, fuente, imagen } = req.body;

        const noticia = new Noticia({ titulo, resumen, contenido, categoria, fuente, imagen });
        await noticia.save();

        // Verificar alertas de noticias
        try {
            const alertas = await AlertaNoticia.find({
                activa: true,
                $or: [
                    { categorias: categoria },
                    { categorias: 'todas' },
                    { categorias: { $size: 0 } },
                ]
            }).populate('usuario', 'nombre apellido email');

            for (const alerta of alertas) {
                await AlertaNoticia.findByIdAndUpdate(alerta._id, {
                    ultimaNotificacion: new Date()
                });
                if (alerta.canales?.email && alerta.usuario?.email) {
                    await enviarAlertaNoticia({
                        destinatario: alerta.usuario.email,
                        nombreUsuario: `${alerta.usuario.nombre} ${alerta.usuario.apellido}`,
                        tituloNoticia: noticia.titulo,
                        categoria: noticia.categoria,
                        resumen: noticia.resumen,
                    });
                }
            }
        } catch (alertaError) {
            console.error('Error al verificar alertas de noticias:', alertaError.message);
        }

        res.status(201).json(noticia);
    } catch (error) {
        res.status(400).json({ message: "Error al crear noticia", error: error.message });
    }
};

export const updateNoticia = async (req, res) => {
    try {
        const { titulo, resumen, contenido, categoria, fuente, imagen } = req.body;

        const noticia = await Noticia.findByIdAndUpdate(
            req.params.id,
            { titulo, resumen, contenido, categoria, fuente, imagen },
            { new: true, runValidators: true }
        );

        if (!noticia) return res.status(404).json({ message: "Noticia no encontrada" });
        res.json(noticia);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar noticia", error: error.message });
    }
};

export const deleteNoticia = async (req, res) => {
    try {
        const noticia = await Noticia.findByIdAndDelete(req.params.id);
        if (!noticia) return res.status(404).json({ message: "Noticia no encontrada" });
        res.json({ message: "Noticia eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar noticia", error: error.message });
    }
};

export const limpiarNoticiasDanadasController = async (req, res) => {
    try {
        const { dryRun = false, soloAutoGeneradas = true, limite = 150 } = req.body || {};
        const resultado = await limpiarNoticiasDanadas({ dryRun, soloAutoGeneradas, limite });

        res.json({
            message: dryRun
                ? `Se encontraron ${resultado.encontradas} noticias sospechosas`
                : `Se limpiaron ${resultado.eliminadas} noticias sospechosas`,
            ...resultado,
        });
    } catch (error) {
        res.status(500).json({ message: "Error al limpiar noticias dañadas", error: error.message });
    }
};
