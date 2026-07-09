from __future__ import annotations

import pandas as pd

from pipeline_fnc_hibrido import EVALUATION_HISTORY_PATH, FNC_HISTORY_PATH, PREDICTION_HISTORY_PATH

print("=" * 60)
print("  EVALUANDO HISTORIAL DE PREDICCIONES FNC")
print("=" * 60)

if not PREDICTION_HISTORY_PATH.exists():
    raise SystemExit("No existe historial_predicciones_fnc.csv todavia.")

if not FNC_HISTORY_PATH.exists():
    raise SystemExit("No existe precios_fnc_historicos.csv.")

df_pred = pd.read_csv(PREDICTION_HISTORY_PATH)
df_real = pd.read_csv(FNC_HISTORY_PATH)

df_pred["fecha_prediccion"] = pd.to_datetime(df_pred["fecha_prediccion"], format="mixed", errors="coerce").dt.normalize()
df_pred["fecha_generacion"] = pd.to_datetime(df_pred["fecha_generacion"], format="mixed", errors="coerce").dt.normalize()
df_real["ds"] = pd.to_datetime(df_real["ds"], format="mixed", errors="coerce").dt.normalize()
df_real["y"] = pd.to_numeric(df_real["y"], errors="coerce")

df_pred = df_pred.dropna(subset=["fecha_prediccion", "fecha_generacion"])
df_pred = df_pred.sort_values(["fecha_prediccion", "fecha_generacion"])
df_pred = df_pred.drop_duplicates(subset=["fecha_prediccion"], keep="last")
df_real = df_real.dropna(subset=["ds", "y"]).rename(columns={"ds": "fecha_prediccion", "y": "precio_real"})

df_eval = df_pred.merge(df_real[["fecha_prediccion", "precio_real"]], on="fecha_prediccion", how="inner")
df_eval["precio_estimado"] = pd.to_numeric(df_eval["precio_estimado"], errors="coerce")
df_eval["precio_minimo"] = pd.to_numeric(df_eval["precio_minimo"], errors="coerce")
df_eval["precio_maximo"] = pd.to_numeric(df_eval["precio_maximo"], errors="coerce")
df_eval = df_eval.dropna(subset=["precio_estimado", "precio_real"])

if df_eval.empty:
    raise SystemExit("Aun no hay predicciones con precio real disponible para evaluar.")

df_eval["error_cop"] = df_eval["precio_estimado"] - df_eval["precio_real"]
df_eval["error_abs"] = df_eval["error_cop"].abs()
df_eval["error_pct"] = (df_eval["error_abs"] / df_eval["precio_real"]) * 100
df_eval["acerto_rango"] = (
    (df_eval["precio_real"] >= df_eval["precio_minimo"])
    & (df_eval["precio_real"] <= df_eval["precio_maximo"])
).astype(int)

df_eval["precio_actual_fnc"] = pd.to_numeric(df_eval["precio_actual_fnc"], errors="coerce")
df_eval["variacion_real_pct"] = (
    (df_eval["precio_real"] - df_eval["precio_actual_fnc"]) / df_eval["precio_actual_fnc"]
) * 100


def clasificar_tendencia_real(row: pd.Series) -> str:
    variacion_cop = row["precio_real"] - row["precio_actual_fnc"]
    variacion_pct = row["variacion_real_pct"]
    if pd.isna(variacion_cop) or pd.isna(variacion_pct):
        return ""
    if abs(variacion_cop) < 22000 or abs(variacion_pct) < 0.55:
        return "estable"
    return "sube" if variacion_pct > 0 else "baja"


df_eval["tendencia_real"] = df_eval.apply(clasificar_tendencia_real, axis=1)

# BUGFIX (2026-07-03): antes se comparaba "tendencia" (la variacion implicita
# del PRECIO del ensemble, calculada con el mismo umbral pero sin relacion con
# el clasificador de direccion) contra "tendencia_real". Eso NO mide el
# acierto del modelo de direccion (modelo_direccion_xgboost.pkl), que es la
# columna "direccion_modelo". Se deja "acerto_tendencia_ensemble" como
# referencia historica, pero la metrica que realmente importa es
# "acerto_tendencia_modelo".
df_eval["acerto_tendencia_ensemble"] = (df_eval["tendencia"] == df_eval["tendencia_real"]).astype(int)
df_eval["acerto_tendencia_modelo"] = (df_eval["direccion_modelo"] == df_eval["tendencia_real"]).astype(int)
# Se mantiene el nombre de columna original para no romper dashboards/consumidores existentes,
# pero ahora apunta al calculo correcto (direccion_modelo vs tendencia_real).
df_eval["acerto_tendencia"] = df_eval["acerto_tendencia_modelo"]

df_eval = df_eval.sort_values(["fecha_generacion", "fecha_prediccion"])
df_eval.to_csv(EVALUATION_HISTORY_PATH, index=False)

mape = float(df_eval["error_pct"].mean())
mae = float(df_eval["error_abs"].mean())
hit_rate = float(df_eval["acerto_rango"].mean() * 100)
trend_hit_rate_modelo = float(df_eval["acerto_tendencia_modelo"].mean() * 100)
trend_hit_rate_ensemble = float(df_eval["acerto_tendencia_ensemble"].mean() * 100)

print(f"Predicciones evaluadas: {len(df_eval)}")
print(f"MAPE acumulado: {mape:.3f}%")
print(f"MAE acumulado: ${mae:,.0f}")
print(f"Hit rate del rango: {hit_rate:.1f}%")
print(f"Acierto de tendencia (modelo_direccion_xgboost, CORRECTO): {trend_hit_rate_modelo:.1f}%")
print(f"Acierto de tendencia (variacion del ensemble, referencia historica): {trend_hit_rate_ensemble:.1f}%")
print("\nUltimas evaluaciones:")
print(
    df_eval.tail(7)[
        [
            "fecha_generacion",
            "fecha_prediccion",
            "precio_estimado",
            "precio_real",
            "precio_minimo",
            "precio_maximo",
            "error_pct",
            "acerto_rango",
            "tendencia",
            "tendencia_real",
            "acerto_tendencia",
        ]
    ].to_string(index=False)
)
print(f"\nOK: evaluacion guardada en {EVALUATION_HISTORY_PATH}")
