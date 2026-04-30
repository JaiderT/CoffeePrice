import mongoose from "mongoose";

const noticiaFuenteHistorialSchema = new mongoose.Schema(
    {
        sourceHash: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        sourceUrl: {
            type: String,
            trim: true,
            default: null,
        },
        sourceTitle: {
            type: String,
            trim: true,
            default: null,
        },
        lastGeneratedAt: {
            type: Date,
            default: Date.now,
        },
        lastOutcome: {
            type: String,
            trim: true,
            default: "generated",
        },
    },
    { timestamps: true }
);

noticiaFuenteHistorialSchema.index({ lastGeneratedAt: -1 });

export default mongoose.model("noticia_fuente_historial", noticiaFuenteHistorialSchema);
