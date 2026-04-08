import mongoose from "mongoose";

const resenaPlataformaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "usuario",
    required: true,
  },
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comentario: {
    type: String,
    required: true,
    trim: true,
  },
  lugar: {
    type: String,
    trim: true,
    default: null,
  },
  aprobada: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

resenaPlataformaSchema.index({ usuario: 1 }, { unique: true });

export default mongoose.model("ResenaPlataforma", resenaPlataformaSchema);
