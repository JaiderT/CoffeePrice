import mongoose from "mongoose";

const reseñaSchema = new mongoose.Schema(
  {
    caficultor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuario",
      required: [true, "El caficultor es obligatorio"],
    },
    comprador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comprador",
      required: [true, "El comprador es obligatorio"],
    },
    calificacion: {
      type: Number,
      required: [true, "La calificación es obligatoria"],
      min: [1, "Mínimo 1 estrella"],
      max: [5, "Máximo 5 estrellas"],
    },
    comentario: {
      type: String,
      trim: true,
      default: null,
    },
    tags: [
      {
        enum: [
          "precio_justo",
          "pago_puntual",
          "buen_trato",
          "precio_real",
          "confiable",
          "bascula_justa",
        ],
      },
    ],
  },
  { timestamps: true }
);

//Un caficultor solo puede reseñar una vez al mismo comprador
reseñaSchema.index({ caficultor: 1, comprador: 1 }, { unique: true });

export default mongoose.model("Reseña", reseñaSchema);
