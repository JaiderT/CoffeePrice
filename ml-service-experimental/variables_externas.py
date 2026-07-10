from __future__ import annotations

from datetime import timedelta

import pandas as pd

from pipeline_fnc_hibrido import DATA_DIR, EXTERNAL_COLUMNS, FNC_HISTORY_PATH

print("=" * 50)
print("GENERANDO VARIABLES EXTERNAS")
print("=" * 50)


def cargar_rango_base() -> pd.DataFrame:
    if not FNC_HISTORY_PATH.exists():
        raise FileNotFoundError("No existe precios_fnc_historicos.csv para construir el calendario base.")
    df_fnc = pd.read_csv(FNC_HISTORY_PATH, parse_dates=["ds"]).sort_values("ds")
    fecha_inicio = df_fnc["ds"].min().normalize() - timedelta(days=7)
    fecha_fin = df_fnc["ds"].max().normalize() + timedelta(days=7)
    return pd.DataFrame({"ds": pd.date_range(start=fecha_inicio, end=fecha_fin, freq="D")})


def merge_optional(df_base: pd.DataFrame, path: str, columns: list[str], fill_value: float | None = None) -> pd.DataFrame:
    full_path = DATA_DIR / path
    if not full_path.exists():
        for column in columns:
            df_base[column] = fill_value if fill_value is not None else 0.0
        return df_base

    df_other = pd.read_csv(full_path, parse_dates=["ds"])
    selected = ["ds", *[column for column in columns if column in df_other.columns]]
    df_other = df_other[selected].copy()
    df_other["ds"] = pd.to_datetime(df_other["ds"], format="mixed", errors="coerce").dt.normalize()
    df_other = df_other.dropna(subset=["ds"]).drop_duplicates(subset=["ds"], keep="last")

    df_base = df_base.merge(df_other, on="ds", how="left")
    for column in columns:
        if column not in df_base.columns:
            df_base[column] = fill_value if fill_value is not None else 0.0

    # BUGFIX (2026-07-10): antes, para columnas con fill_value fijo
    # (petroleo_wti, clima), CUALQUIER fecha sin match exacto -incluyendo
    # las mas recientes, justo las que importan para la prediccion de HOY-
    # volvia directo al valor constante "muerto" (ej. 78.5), aunque hubiera
    # un dato real de 1-2 dias antes disponible. Ahora primero se propaga
    # hacia adelante el ultimo valor real conocido (ffill, sin mirar al
    # futuro para evitar fuga de informacion) y el valor fijo queda solo
    # como ultimo recurso para fechas anteriores a cualquier dato real.
    df_base[columns] = df_base[columns].ffill()
    if fill_value is None:
        df_base[columns] = df_base[columns].bfill()
    else:
        df_base[columns] = df_base[columns].fillna(fill_value)
    return df_base


df = cargar_rango_base()

# NUEVO (2026-07-03): antes petroleo_wti/flete_fbx/volumen_ice eran constantes
# fijas ("Proxy variables while the sources are still experimental"), lo que
# las dejaba sin varianza y sin ningun valor predictivo real para el modelo.
# Ahora petroleo_wti se completa con datos reales (wti_historico.csv,
# generado por obtener_wti_automatico.py con el futuro CL=F de Yahoo
# Finance), con ffill para dias recientes sin dato aun (ver merge_optional).
#
# flete_fbx y volumen_ice se retiraron del pipeline por completo (sin fuente
# gratuita confiable) - ver EXTERNAL_COLUMNS en pipeline_fnc_hibrido.py.
df = merge_optional(df, "wti_historico.csv", ["petroleo_wti"], fill_value=78.5)
df = merge_optional(df, "usd_brl_historico.csv", ["usd_brl"])
df = merge_optional(df, "clima_brasil.csv", ["clima_brasil_alerta", "clima_brasil_intensidad"], fill_value=0.0)
df = merge_optional(df, "inventarios_ice.csv", ["inventario_ice"])

df = df[["ds", *EXTERNAL_COLUMNS]].sort_values("ds").reset_index(drop=True)
df.to_csv(DATA_DIR / "variables_externas.csv", index=False)

ultimo = df.iloc[-1].to_dict()
ultimo["ds"] = str(pd.Timestamp(ultimo["ds"]).date())

print(f"OK: variables externas generadas con {len(df)} registros")
print(f"   Rango: {df['ds'].min().date()} a {df['ds'].max().date()}")
print(f"   Ultimo registro: {ultimo}")
