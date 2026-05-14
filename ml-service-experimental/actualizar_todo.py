from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from pipeline_fnc_hibrido import METRICS_PATH, load_json

BASE_DIR = Path(__file__).resolve().parent
PYTHON = sys.executable

parser = argparse.ArgumentParser(description="Ejecuta el pipeline completo FNC hibrido.")
parser.add_argument(
    "--fecha-prediccion",
    help="Fecha objetivo en formato YYYY-MM-DD para generar una prediccion especifica.",
)
args = parser.parse_args()

print("=" * 60)
print("  ACTUALIZACION COMPLETA FNC HIBRIDO")
print("=" * 60)
print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

steps = [
    {"script": "obtener_kc_automatico.py", "label": "Actualizando KC", "critical": True},
    {"script": "obtener_trm_automatico.py", "label": "Actualizando TRM", "critical": True},
    {"script": "obtener_fnc_automatico.py", "label": "Actualizando FNC", "critical": False},
    {"script": "obtener_usd_brl.py", "label": "Actualizando USD/BRL", "critical": False},
    {"script": "obtener_clima_brasil.py", "label": "Actualizando clima Brasil", "critical": False},
    {"script": "obtener_inventarios_ice.py", "label": "Actualizando inventarios ICE", "critical": False},
    {"script": "limpiar_datos.py", "label": "Limpiando datos", "critical": True},
    {"script": "variables_externas.py", "label": "Construyendo variables externas", "critical": True},
    {"script": "entrenar_fnc_hibrido.py", "label": "Entrenando modelo", "critical": True},
    {"script": "predecir_fnc_hibrido.py", "label": "Generando prediccion", "critical": True},
    {"script": "evaluar_predicciones_fnc.py", "label": "Evaluando historial", "critical": False},
]

errors = []
warnings = []

for step in steps:
    print(f"\n[{step['label']}]")
    command = [PYTHON, step["script"]]
    if step["script"] == "predecir_fnc_hibrido.py" and args.fecha_prediccion:
        command.extend(["--fecha-prediccion", args.fecha_prediccion])

    result = subprocess.run(command, cwd=BASE_DIR)
    if result.returncode == 0:
        continue
    if step["critical"]:
        errors.append(step["script"])
        print(f"ERROR critico en {step['script']}")
        break
    warnings.append(step["script"])
    print(f"ADVERTENCIA en {step['script']} - se continua con el pipeline")

print("\n" + "=" * 60)
if errors:
    print(f"ACTUALIZACION FALLIDA. Error en: {errors}")
    print("=" * 60)
    raise SystemExit(1)

reporte = load_json(METRICS_PATH, default={})
estado_modelo = reporte.get("estado_modelo", "sin_reporte")
estrategia = reporte.get("estrategia_seleccionada", "sin_reporte")
holdout = reporte.get("metricas", {}).get("holdout", {})

print("ACTUALIZACION COMPLETADA")
print(f"Estado modelo: {estado_modelo}")
print(f"Estrategia seleccionada: {estrategia}")
if holdout:
    print(
        "Holdout MAPE -> "
        f"naive: {holdout.get('mape_naive')}% | "
        f"prophet: {holdout.get('mape_prophet')}% | "
        f"hybrid: {holdout.get('mape_hybrid')}%"
    )
if warnings:
    print(f"Advertencias no criticas: {warnings}")
print("=" * 60)
