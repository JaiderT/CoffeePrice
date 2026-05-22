import mongoose from 'mongoose';

const precioFNCSchema = new mongoose.Schema({
  precio: { type: Number, required: true },
  fuente: { type: String, default: 'fnc-directo' },
}, { timestamps: true });

export default mongoose.model('PrecioFNC', precioFNCSchema);