import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

const options = {
  serverSelectionTimeoutMS: 5000,  // Timeout al seleccionar servidor
  socketTimeoutMS: 45000,           // Timeout de socket
  maxPoolSize: 10,                  // Maximo de conexiones en el pool
  minPoolSize: 2,                   // Minimo de conexiones siempre activas
  connectTimeoutMS: 10000,          // Timeout de conexion inicial
  heartbeatFrequencyMS: 10000,      // Frecuencia del heartbeat
};

mongoose.connect(uri, options)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => {
    console.error("Error al conectar a MongoDB", err.message);
    process.exit(1); // Falla rapido en lugar de correr sin DB
  });

mongoose.connection.on("disconnected", () => {
  console.warn("[DB] Desconectado de MongoDB. Reconectando...");
});

mongoose.connection.on("reconnected", () => {
  console.log("[DB] Reconectado a MongoDB.");
});

export default mongoose.connection;