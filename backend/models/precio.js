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
            required: [true, "El precio por carga en necesario"]
        },
        preciokg: {
            type: Number,

        },
        tipocafe: {
            enum: ["pergamino_seco", "especial", "organico", "verde"],
        },
    },
    { timestamps: true }
);

preciosSchema.pre("save", function (next) {
    this.preciokg = Math.round(this.preciocarga / 125),
    next();
});

export default mongoose.model("precio", preciosSchema);