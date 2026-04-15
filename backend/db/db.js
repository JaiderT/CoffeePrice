import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
.then(() => console.log("✅ Conectado a la base de datos"))
.catch(err => console.error("❌ Error al conectar a la base de datos", err));