import logging
import os
import subprocess
import sys
from datetime import date

os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('logs/actualizacion.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout),
    ],
)


def es_dia_habil():
    return date.today().weekday() < 5


def ejecutar(nombre, comando):
    logging.info(f'Iniciando: {nombre}')
    try:
        resultado = subprocess.run(
            comando,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if resultado.returncode == 0:
            logging.info(f'OK: {nombre}')
            salida = resultado.stdout.strip()
            if salida:
                for linea in salida.splitlines()[-5:]:
                    logging.info(f'   {linea}')
            return True

        logging.error(f'FALLO: {nombre}')
        error = (resultado.stderr or resultado.stdout or '').strip()
        logging.error(f'   Error: {error[:500]}')
        return False
    except subprocess.TimeoutExpired:
        logging.error(f'TIMEOUT: {nombre} (>5 min)')
        return False
    except Exception as exc:
        logging.error(f'EXCEPCION en {nombre}: {exc}')
        return False


def main():
    logging.info('=' * 60)
    logging.info(f'INICIO ACTUALIZACION - {date.today()}')
    logging.info('=' * 60)

    python = sys.executable
    errores = []

    ok = ejecutar('Actualizar TRM', [python, 'scripts/obtener_trm.py'])
    if not ok:
        errores.append('TRM')

    if es_dia_habil():
        ok = ejecutar('Obtener precio KC (Bolsa NY)', [python, 'scripts/obtener_kc.py'])
        if not ok:
            errores.append('KC')

        ok = ejecutar('Obtener precio FNC real', [python, 'scripts/obtener_fnc.py'])
        if not ok:
            errores.append('FNC')

        if date.today().weekday() == 0:
            ok = ejecutar('Limpiar datos', [python, 'limpiar_datos.py'])
            if not ok:
                errores.append('limpiar')

        ok = ejecutar('Entrenar modelo', [python, 'entrenar.py'])
        if not ok:
            errores.append('entrenar')
            logging.warning('Entrenamiento fallo; se usara el modelo anterior si existe')
    else:
        logging.info('Fin de semana detectado; se omiten KC, FNC y entrenamiento')

    ok = ejecutar('Generar predicciones', [python, 'predecir.py'])
    if not ok:
        errores.append('predicciones')

    ok = ejecutar('Importar a MongoDB', ['node', '../backend/scripts/importarPredicciones.js'])
    if not ok:
        errores.append('mongodb')

    ok = ejecutar('Evaluar precision', [python, 'evaluar.py'])
    if not ok:
        logging.warning('Evaluacion fallo; no es un error critico')

    logging.info('=' * 60)
    if errores:
        logging.warning(f'ACTUALIZACION COMPLETADA CON ERRORES EN: {errores}')
    else:
        logging.info('ACTUALIZACION COMPLETADA SIN ERRORES')
    logging.info('=' * 60)


if __name__ == '__main__':
    main()
