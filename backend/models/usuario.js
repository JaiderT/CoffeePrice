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
  googleId: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: false,
    default: null,
    minlength: [8, "minimo 8 caracteres"],
  },
  celular: {
    type: String,
    trim: true,
  },
  rol: {
    type: String,
    enum: ["productor", "comprador", "admin"],
    required: [true, "rol necesario"],
    default: "productor"
  },
  estado: {
    type: String,
    enum: ["activo", "pendiente", "rechazado"],
    default: "activo"
  }
}, 
{ timestamps: true }
);

export default mongoose.model("usuario", usuarioSchema);
