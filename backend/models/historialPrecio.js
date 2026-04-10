import mongoose from "mongoose";

const historialPrecioSchema = new mongoose.Schema({
  comprador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "comprador",
    required: true,
  },
  preciocarga: {
    type: Number,
    required: true,
  },
  preciokg: {
    type: Number,
  },
  tipocafe: {
    type: String,
    enum: ["pergamino_seco", "especial", "organico", "verde"],
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("HistorialPrecio", historialPrecioSchema);
