import mongoose from "mongoose";

const configuracionSchema = new mongoose.Schema({
  precioMinimo: { type: Number, default: 500000 },
  precioMaximo: { type: Number, default: 5000000 },
  diasHistorial: { type: Number, default: 30 },
  alertasActivas: { type: Boolean, default: true },
  registroAbierto: { type: Boolean, default: true },
  municipios: { type: [String], default: ['El Pital', 'Pitalito', 'Acevedo', 'La Argentina', 'Tarqui'] },
  tiposCafe: {
    type: [{
      value: String,
      label: String,
      emoji: String,
      activo: { type: Boolean, default: true },
    }],
    default: [
      { value: 'pergamino_seco', label: 'Pergamino seco', emoji: '☕', activo: true },
      { value: 'especial', label: 'Especial / Fino', emoji: '✨', activo: true },
      { value: 'organico', label: 'Orgánico', emoji: '🌿', activo: true },
      { value: 'verde', label: 'Café verde', emoji: '🍃', activo: true },
    ]
  },
}, { timestamps: true });

export default mongoose.model("configuracion", configuracionSchema);
