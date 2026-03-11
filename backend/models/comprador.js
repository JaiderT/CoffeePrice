import mongoose from "mongoose";

const compradorSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
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
    }
    { timestamps: true }
);

export default mongoose.model("comprador", compradorSchema);