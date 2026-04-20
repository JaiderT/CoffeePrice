import mongoose from "mongoose";

const alertaNoticiaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "usuario",
    required: true,
  },
  categorias: [{
    type: String,
    enum: ["mercado", "produccion", "internacional", "fnc", "clima", "consejos", "el_pital", "todas"],
  }],
  canales: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
  },
  activa: { type: Boolean, default: true },
  ultimaNotificacion: { type: Date, default: null },
}, { timestamps: true });

alertaNoticiaSchema.index({ usuario: 1 }, { unique: true });

export default mongoose.model("alertaNoticia", alertaNoticiaSchema);
