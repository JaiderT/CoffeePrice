import mongoose from "mongoose";

const preciosSchema = new mongoose.Schema(
    {
        comprador: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "comprador",
            required: [true, "El rol Comprador es necesario"]
        },
        preciocarga: {
            type: Number,
            required: [true, "El precio por carga es necesario"]
        },
        preciokg: {
            type: Number,
        },
        tipocafe: {
            type: String,
            enum: ["pergamino_seco", "especial", "organico", "verde"],
            default: "pergamino_seco"
        },
    },
    { timestamps: true }
);

preciosSchema.pre("save", async function () {
    this.preciokg = Math.round(this.preciocarga / 125);
});

export default mongoose.model("precio", preciosSchema);
