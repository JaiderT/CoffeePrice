import mongoose from "mongoose";

const uri = "mongodb+srv://diazmotajhoandanilo_db_user:jjj_2026@coffepricecluster.eqgthtr.mongodb.net/CoffePrice?retryWrites=true&w=majority"

mongoose.connect(uri)
.then(() => console.log("✅ Conectado a la base de datos"))
.catch(err => console.error("❌ Error al conectar a la base de datos", err));