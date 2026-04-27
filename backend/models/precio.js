import mongoose from "mongoose";

const UNIDAD_POR_TIPO = {
  pergamino_seco: 'carga',
  especial: 'carga',
  organico: 'carga',
  pasilla: 'kg',
  cacao: 'kg',
  limon: 'kg',
};

const preciosSchema = new mongoose.Schema(
  {
    comprador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comprador",
      required: [true, "El comprador es necesario"],
    },
    tipocafe: {
      type: String,
      required: [true, "tipo de producto necesario"],
      enum: ["pergamino_seco", "especial", "organico", "verde", "pasilla", "cacao", "limon"],
    },
    preciocarga: {
      type: Number,
      required: [true, "El precio es necesario"],
    },
    preciokg: {
      type: Number,
    },
    unidad: {
      type: String,
      enum: ['carga', 'kg'],
      default: 'carga',
    },
  },
  { timestamps: true }
);

preciosSchema.pre("save", async function () {
  const unidad = UNIDAD_POR_TIPO[this.tipocafe] || 'carga';
  this.unidad = unidad;
  if (unidad === 'carga') {
    this.preciokg = Math.round(this.preciocarga / 125);
  } else {
    // Para productos por kg, preciocarga ES el precio por kg
    this.preciokg = this.preciocarga;
  }
});

export default mongoose.model("precio", preciosSchema);
