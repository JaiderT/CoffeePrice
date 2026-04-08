import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Prediccion from "../models/Prediccion.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaJson = path.resolve(__dirname, "../datos/predicciones.json")
async function importarPredicciones() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("Falta la variable de entorno MONGODB_URI");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Conexion a MongoDB");

        const contenido = await fs.readFile(rutaJson, "utf-8");
        const predicciones = JSON.parse(contenido);

        if (!Array.isArray(predicciones)) {
            throw new Error("El Archivo .json no tiene un arreglo valido");
        }
        console.log(`predicciones leidas desde json: ${predicciones.length}`);
        await Prediccion.deleteMany({});
        console.log("Predicciones anteriores eliminadas");

        await Prediccion.insertMany(predicciones);
        console.log("Nuevas predicciones insertadas correctamente");
    } catch (error) {
        console.error("Error al importar predicciones:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("Conexion cerrada");
    } 
}
importarPredicciones();