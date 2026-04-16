import mongoose from "mongoose";

const alertaSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuario",
      required: [true, "El usuario es obligatorio"],
    },
    comprador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comprador",
      default: null, // null = alerta para cualquier comprador
    },
    precioMinimo: {
      type: Number,
      required: [true, "El precio mínimo es obligatorio"],
    },
    canales: {
      whatsapp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    activa: {
      type: Boolean,
      default: true,
    },
    ultimaNotificacion: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Alerta", alertaSchema);
