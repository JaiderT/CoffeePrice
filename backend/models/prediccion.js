import mongoose from "mongoose";

const prediccionSchema = new mongoose.Schema(
    {

    fecha: {
        type: Date,
        required: [true, "La fecha es obligatoria"],
    },

    precioestimado: {
        type: Number,
        required: [true, "El precio estimado es obligatorio"],
    },

    preciominimo: {
        type: Number,
        required: [true, "El precio mínimo es obligatorio"],
    },

    preciomaximo: {
        type: Number,
        required: [true, "El precio máximo es obligatorio"],
    },

    tendencia: {
        type: String,
        enum: ["sube", "baja", "estable"],
        default: "estable",
    },

    confianza: {
        type: Number,
        min: 0,
        max: 100,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    modelVersion: {
        type: String,
        default: "fnc_hibrido",
    },
},
    { timestamps: true }
);

export default mongoose.model("prediccion", prediccionSchema);
