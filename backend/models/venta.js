import mongoose from "mongoose";

const ventaSchema = new mongoose.Schema(
  {
    caficultor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuario",
      required: [true, "El caficultor es obligatorio"],
    },
    comprador: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"comprador",
      required: [true, "El caficultor es obligatorio"],
    },
    cantidadCargas:{
      type: Number,
      required: [true, "La cantidad de cargas es obligatoria"],
      min: [1, "Mínimo 1 carga"],
    },
    pesoKg: {
      type: Number,
    },
    precioXCarga:{
      type: Number,
      required: [true, "El precio por carga es obligatorio"],
    },
    totalCOP:{
      type: Number,
    },
    tipoCafe: {
      type: String,
      enum: ["pergamino_seco", "especial", "organico", "verde"],
      default: "pergamino_seco",
    },
    estadoPago:{
      type: String,
      enum: ["pendiente", "pagado"],
      default: "pendiente"
    },
    notas: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

//Calcular peso y total automaticamente antes de guardar
ventaSchema.pre("save", function (next) {
  this.pesoKg = this.cantidadCargas * 125;
  this.totalCOP = this.cantidadCargas * this.precioXCarga;
  next();
});

export default mongoose.model("Venta", ventaSchema);
