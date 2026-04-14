import mongoose from "mongoose";

const noticiaSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: [true, "El titulo es obligatorio"],
            trim: true,
        },

        imagen: {
            type: String,
            required: true
        },

        resumen: {
            type: String,
            required: [true, "El resumen es obligatorio"],
            trim: true,
        },

        contenido: {
            type: String,
            required: [true, "El contenido es obligatorio"],
        },

        categoria: {
            type: String,
            enum: ["mercado", "produccion", "internacional", "fnc", "clima", "consejos", "el_pital"],
        },

        fuente: {
            type: String,
            trim: true,
            default: null,
        },
        sourceUrl: {
            type: String,
            trim: true,
            default: null,
        },
        sourceTitle: {
            type: String,
            trim: true,
            default: null,
        },
        sourceDomain: {
            type: String,
            trim: true,
            default: null,
        },
        sourceHash: {
            type: String,
            trim: true,
            default: null,
        },
        sourceImage: {
            type: String,
            trim: true,
            default: null,
        },
        publishedAt: {
            type: Date,
            default: null,
        },
        tipoImagen: {
            type: String,
            enum: ["source", "generated", "fallback"],
            default: "fallback",
        },
        autoGenerada: {
            type: Boolean,
            default: false,
        },
        cicloGeneracion: {
            type: String,
            default: null,
        },
    },

    { timestamps: true }
);
// Indice para busqueda rapida
noticiaSchema.index({ createdAt: -1 });
noticiaSchema.index({ categoria: 1, createdAt: -1 });
noticiaSchema.index({ sourceHash: 1 }, { unique: true, sparse: true });
noticiaSchema.index({ sourceUrl: 1 }, { sparse: true });

export default mongoose.model("noticia", noticiaSchema);
