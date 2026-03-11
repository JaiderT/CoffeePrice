import mongoose from "mongoose";

const solicitudSchema = new mongoose.Schema(
    {
        caficultor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "usuario",
            required: [true, "El caficultor es obligatorio"],
        },

        comprador: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "comprador",
            required: [true, "El comprador es obligatorio"],
        },

        cantidadcargas: {
            type: Number,
            required: [true, "La cantidad de cargas es obligatoria"],
            min: [1, "Minimo una carga"],
        },

        tipocafe: {
            type: String,
            enum: ["pergamino_seco", "especial", "organico", "verde"],
            default: "pergamino_seco",
        },

        estado: {
            type: String,
            enum: ["pendiente", "aceptada", "rechazada"],
            default: "pendiente",
        },

        mensaje: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("solicitud", solicitudSchema);