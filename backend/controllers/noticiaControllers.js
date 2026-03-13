import Noticia from "../models/noticia.js";

export const getNoticias = async (req, res) => {
    try {
        const { categoria } = req.query;
        const filtro = categoria ? { categoria } : {};

        const noticias = await Noticia.find(filtro).sort({ createdAt: -1 });
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
        const { titulo, resumen, contenido, categoria, fuente } = req.body;

        const noticia = new Noticia({ titulo, resumen, contenido, categoria, fuente });
        await noticia.save();

        res.status(201).json(noticia);
    } catch (error) {
        res.status(400).json({ message: "Error al crear noticia", error: error.message });
    }
};

export const updateNoticia = async (req, res) => {
    try {
        const { titulo, resumen, contenido, categoria, fuente } = req.body;

        const noticia = await Noticia.findByIdAndUpdate(
            req.params.id,
            { titulo, resumen, contenido, categoria, fuente },
            { new: true, runValidators: true }
        );

        if (!noticia) return res.status(404).json({ message: "Noticia no encontrada" });
        res.json(noticia); // ✅ era res,json
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