import mongoose from "mongoose";
import { ESTADOS_REVISION_COMPRADOR } from "../utils/compradorEstado.js";
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
            unique: true,
        },
        tipoempresa: {
            type: String,
            enum: ["cooperativa", "trilladora", "independiente", "exportadora", "otro"],
            default: "independiente",
        },
        direccion: {
            type: String,
            required: [true, "direccion necesaria"],
            trim: true,
        },
        municipio: {
            type: String,
            trim: true,
            default: "El Pital",
        },
        telefono: {
            type: String,
            trim: true,
            default: null,
        },
        descripcion: {
            type: String,
            trim: true,
            default: null,
            maxlength: 300,
        },
        servicios: [{
            type: String,
            trim: true,
        }],
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
        latitud: {
            type: Number,
            default: null,
        },
        longitud: {
            type: Number,
            default: null,
        },
        UbicacionVerificada: {
            type: Boolean,
            default: false,
        },
        estadoRevision: {
            type: String,
            enum: Object.values(ESTADOS_REVISION_COMPRADOR),
            default: ESTADOS_REVISION_COMPRADOR.PERFIL_INCOMPLETO,
        },
        motivoRevision: {
            type: String,
            trim: true,
            default: null,
            maxlength: 500,
        },
        fechaRevision: {
            type: Date,
            default: null,
        },
        aprobadoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "usuario",
            default: null,
        },
    },
    { timestamps: true }
);
export default mongoose.model("comprador", compradorSchema);
