import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, "minimo 8 caracteres"],
  },
  celular: {
    type: String,
    trim: true,
  },
  rol: {
    enum: ["productor", "comprador", "admin"],
    required: [true, "rol necesario"],
    default: "productor"
  }
}, 
{ timestamps: true }
);

export default mongoose.model("usuario", usuarioSchema);
