import mongoose from "mongoose";
const compradorSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "usuario",
            required: [true, "El Rol usuario es necesario"]
        },
        nombreempresa: {
            type: String,
            required: [true, "nombre de la empresa necesaria"],
            trim: true,
        },
        direccion: {
            type: String,
            required: [true, "direccion necesaria"],
            trim: true,
        },
        telefono: {
            type: String,
            trim: true,
            default: null,
        },
        horario: {
            type: String,
            trim: true,
            default: null,
        },
        horarioApertura: {
            type: String,
            trim: true,
            default: "07:00",
        },
        horarioCierre: {
            type: String,
            trim: true,
            default: "17:00",
        },
    },
    { timestamps: true }
);
export default mongoose.model("comprador", compradorSchema);
