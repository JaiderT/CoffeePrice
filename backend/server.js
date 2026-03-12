import express from 'express';
import cors from 'cors';
import "dotenv/config";
import "./db/db.js";

const app = express();

app.use(cors({}));

app.get('/', (req, res) => {
    res.send('Servidor con CORS activado🚀');
});

app.listen(8081, () => console.log('Servidor corriendo en http://localhost:8081'));