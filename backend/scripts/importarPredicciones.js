import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Prediccion from "../models/prediccion.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const rutaJson = path.resolve(__dirname, "../datos/predicciones.json");

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

        const insertadas = await Prediccion.insertMany(predicciones);
        console.log(`Nuevas predicciones insertadas correctamente: ${insertadas.length}`);
    } catch (error) {
        console.error("Error al importar predicciones:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log("Conexion cerrada");
    } 
}
importarPredicciones();
