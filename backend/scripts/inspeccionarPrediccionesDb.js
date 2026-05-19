import "dotenv/config";
import "../config/env.js";
import mongoose from "mongoose";
import Prediccion from "../models/prediccion.js";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const total = await Prediccion.countDocuments();
  const versions = await Prediccion.aggregate([
    { $group: { _id: "$modelVersion", total: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const sample = await Prediccion.find()
    .sort({ fecha: -1 })
    .limit(15)
    .select("fecha modelVersion generatedAt tendencia precioestimado")
    .lean();

  console.log(JSON.stringify({ total, versions, sample }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });
