import cron from 'node-cron';
import { generarNoticiasDelDia, limpiarNoticiasViejas } from '../services/noticiaAutoService.js';

export async function iniciarCronNoticias() {
    const generarAlIniciar = process.env.NOTICIAS_GENERAR_AL_INICIAR === 'true';

    if (generarAlIniciar) {
        console.log('[Cron] Ejecutando generacion inicial...');

        try {
            const creadas = await generarNoticiasDelDia();
            console.log(`[Cron] Generacion inicial completada. Noticias creadas: ${creadas}`);
        } catch (e) {
            console.error('[Cron] Error en generacion inicial:', e.message);
        }
    } else {
        console.log('[Cron] Generacion inicial omitida. Configure NOTICIAS_GENERAR_AL_INICIAR=true para activarla.');
    }

    cron.schedule('0 6,12,18,0 * * *', async () => {
        const hora = new Date().toLocaleTimeString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit'
        });

        console.log(`[Cron] ${hora} - Ejecutando generacion de noticias...`);

        try {
            const creadas = await generarNoticiasDelDia();
            console.log(`[Cron] ${hora} - Generacion completada. Noticias creadas: ${creadas}`);
        } catch (error) {
            console.error(`[Cron] ${hora} - Error generando noticias:`, error.message);
        }
    }, {
        timezone: 'America/Bogota'
    });

    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] 3:00 AM - Limpiando noticias viejas...');

        try {
            const eliminadas = await limpiarNoticiasViejas();
            console.log(`[Cron] Limpieza completada. Noticias eliminadas: ${eliminadas}`);
        } catch (error) {
            console.error('[Cron] Error limpiando noticias viejas:', error.message);
        }
    }, {
        timezone: 'America/Bogota'
    });

    console.log('[Cron] Scheduler de noticias activo:');
    console.log(' Generacion: 6:00 AM / 12:00 PM / 6:00 PM / 12:00 AM (Bogota)');
    console.log(' Limpieza: 3:00 AM diaria (Conserva los ultimos 7 dias)');
}
