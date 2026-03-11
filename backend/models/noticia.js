import mongoose from "mongoose";

const noticiaSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: [true, "El titulo es obligatorio"],
            trim: true,
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
            enum: ["mercado", "produccion", "internacional", "fnc", "clima", "consejos"],
        },

        fuente: {
            type: String,
            trim: true,
            default: null,
        },
    },

    { timestamps: true }
);

export default mongoose.model("noticia", noticiaSchema);