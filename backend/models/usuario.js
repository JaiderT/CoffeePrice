import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  rol: {
    enum: ["productor", "comprador", "admin", "visitante"],
    default: "visitante"
  }
}, { timestamps: true });

export default mongoose.model("usuario", userSchema);
