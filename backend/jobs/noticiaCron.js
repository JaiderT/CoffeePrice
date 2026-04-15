import cron from 'node-cron';
import { generarNoticiasDelDia, limpiarNoticiasViejas } from '../services/noticiaAutoService.js';

export async function iniciarCronNoticias() {
    console.log("[Cron] Ejecutando generacion inicial...");
    try {
        await generarNoticiasDelDia();
    } catch (e) {
        console.error("[Cron] Error en generacion inicial:", e.message); 
    }
    cron.schedule('0 6,12,18,0 * * *', async () => {
        const hora = new Date().toLocaleTimeString('es-CO', {
            timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit'
        });
        console.log(`[Cron] ${hora} - Ejecutando generacion de noticias....`);
        await generarNoticiasDelDia();
    }, {
        timezone: 'America/Bogota'
    });
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] 3:00 AM - Limpiando noticias viejas....');
        await limpiarNoticiasViejas();
    }, {
        timezone: 'America/Bogota'
    });
    console.log('[Cron] Scheduler de noticias activo:');
    console.log(' Generacion: 6:00 AM / 12:00 PM / 6:00 PM / 12:00 AM (Bogota)');
    console.log(' Limpieza: 3:00 AM diaria (Conserva los ultimos 7 dias)');
}