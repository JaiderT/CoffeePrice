import cron from 'node-cron';
import {
    generarNoticiasDelDia,
    limpiarNoticiasMedianoche,
    limpiarNoticiasPorVentana,
} from '../services/noticiaAutoService.js';

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
            if (hora === '12:00') {
                const eliminadasMedianoche = await limpiarNoticiasMedianoche();
                if (eliminadasMedianoche > 0) {
                    console.log(`[Cron] ${hora} - Limpieza previa de medianoche: ${eliminadasMedianoche} noticia(s) eliminada(s)`);
                }
            }

            const creadas = await generarNoticiasDelDia();
            console.log(`[Cron] ${hora} - Generacion completada. Noticias creadas: ${creadas}`);
        } catch (error) {
            console.error(`[Cron] ${hora} - Error generando noticias:`, error.message);
        }
    }, {
        timezone: 'America/Bogota'
    });

    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] 3:00 AM - Limpiando ventanas anteriores...');

        try {
            const eliminadas = await limpiarNoticiasPorVentana();
            console.log(`[Cron] Limpieza completada. Noticias eliminadas: ${eliminadas}`);
        } catch (error) {
            console.error('[Cron] Error limpiando noticias por ventana:', error.message);
        }
    }, {
        timezone: 'America/Bogota'
    });

    console.log('[Cron] Scheduler de noticias activo:');
    console.log(' Generacion: 6:00 AM / 12:00 PM / 6:00 PM / 12:00 AM (Bogota)');
    console.log(' Limpieza: 3:00 AM borra lotes 6 AM / 12 PM / 6 PM del dia anterior');
    console.log(' Limpieza adicional: 12:00 PM borra lote de medianoche del mismo dia');
}
