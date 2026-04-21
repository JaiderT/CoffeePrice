import 'dotenv/config';
import mongoose from 'mongoose';
import Noticia from '../models/noticia.js';
import { limpiarNoticiasDanadas } from '../services/noticiaAutoService.js';

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Falta la variable de entorno MONGODB_URI');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const dryRun = process.argv.includes('--dry-run');
    const resultado = await limpiarNoticiasDanadas({
        dryRun,
        soloAutoGeneradas: true,
        limite: 250,
    });

    console.log(
        dryRun
            ? `[Noticias] Candidatas encontradas: ${resultado.encontradas}`
            : `[Noticias] Noticias eliminadas: ${resultado.eliminadas}`
    );

    resultado.candidatas.slice(0, 20).forEach((noticia, index) => {
        console.log(
            `${index + 1}. ${noticia.titulo} | fuente: ${noticia.sourceTitle || 'sin sourceTitle'} | razones: ${noticia.razones.join(', ')}`
        );
    });

    await Noticia.db.close();
    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error('[Noticias] Error limpiando noticias dañadas:', error.message);
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    process.exit(1);
});
