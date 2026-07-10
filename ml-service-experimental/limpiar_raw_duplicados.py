from __future__ import annotations

from pathlib import Path

import pandas as pd

from pipeline_fnc_hibrido import DATA_DIR

print("=" * 60)
print("  LIMPIEZA DE ARCHIVOS CRUDOS CON DUPLICACION MASIVA")
print("=" * 60)
print(
    "Se encontraron archivos como 'Precios_cafe.csv' (24.9M de filas) y\n"
    "'Tasa_de_cambio_TRM.csv' (varios GB) donde una sola fila real esta\n"
    "repetida millones de veces. No afectan el entrenamiento actual porque\n"
    "pipeline_fnc_hibrido.py ya los ignora si pesan mas de 50MB, pero inflan\n"
    "el repositorio y son un riesgo si ese limite cambia. Este script los\n"
    "deduplica in-place conservando una sola copia de cada fila real.\n"
)

# Ajusta esta lista si tienes otros archivos crudos con el mismo problema.
ARCHIVOS_A_REVISAR = [
    DATA_DIR / "Precios_cafe.csv",
    DATA_DIR / "Precios cafe.csv",
    DATA_DIR / "Tasa_de_cambio_TRM.csv",
    DATA_DIR / "Tasa de cambio TRM.csv",
]

UMBRAL_SOSPECHA_MB = 5  # cualquier CSV de este tamaño con pocas columnas es sospechoso


def limpiar_archivo(path: Path) -> None:
    if not path.exists():
        print(f"  (no existe) {path.name}")
        return

    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"\n  Archivo: {path.name} ({size_mb:.1f} MB)")

    if size_mb < UMBRAL_SOSPECHA_MB:
        print("    Tamaño normal, no requiere limpieza.")
        return

    df = pd.read_csv(path)
    filas_antes = len(df)
    df_limpio = df.drop_duplicates(keep="first")
    filas_despues = len(df_limpio)

    ratio_duplicado = 1 - (filas_despues / filas_antes) if filas_antes else 0
    print(f"    Filas antes: {filas_antes:,}")
    print(f"    Filas despues de deduplicar: {filas_despues:,}")
    print(f"    Duplicacion: {ratio_duplicado * 100:.1f}%")

    if ratio_duplicado < 0.5:
        print("    La duplicacion es baja, se revisa manualmente antes de sobrescribir (no se modifica).")
        return

    backup_path = path.with_suffix(path.suffix + ".bak_antes_de_limpiar")
    if not backup_path.exists():
        path.rename(backup_path)
        df_limpio.to_csv(path, index=False)
        print(f"    OK: archivo limpio guardado. Backup en {backup_path.name}")
    else:
        print(f"    Ya existe un backup ({backup_path.name}), no se sobrescribe para evitar perder datos.")


for archivo in ARCHIVOS_A_REVISAR:
    limpiar_archivo(archivo)

print("\n" + "=" * 60)
print("Listo. Revisa los archivos *.bak_antes_de_limpiar antes de borrarlos definitivamente.")
print("=" * 60)
