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

export default mongoose.model("noticia", noticiaSchema);