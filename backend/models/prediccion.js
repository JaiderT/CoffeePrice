import mongoose from "mongoose";

const prediccionSchema = new mongoose.Schema(
    {

    fecha: {
        type: Date,
        required: [true, "La fecha es obligatoria"],
    },

    precioestimado: {
        type: Number,
        required: [true, "Elprecio estimado es obligarotio"],
    },

    preciominimo: {
        type: Number,
        required: [true, "El precio minimo es obligatorio"],
    },

    preciomaximo: {
        type: Number,
        required: [true, "El precio maximo es obligatorio"],
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
        default: "prophet-v1",
    },
},
    { timestamps: true }
);

export default mongoose.model("prediccion", prediccionSchema);