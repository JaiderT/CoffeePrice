from __future__ import annotations

import argparse
import pickle

import pandas as pd

from pipeline_fnc_hibrido import (
    BACKEND_PREDICTION_HISTORY_PATH,
    DIRECTION_LABELS,
    DIRECTION_MODEL_PATH,
    PREDICTION_HISTORY_PATH,
    adjust_weights_for_signal,
    FEATURE_CONFIG_PATH,
    METRICS_PATH,
    MODEL_DIR,
    PREDICTION_JSON_PATH,
    PROPHET_MODEL_PATH,
    XGBOOST_MODEL_PATH,
    compute_market_signal_strength,
    build_daily_base,
    build_supervised_frame,
    load_clean_kc,
    load_clean_trm,
    load_json,
    save_json,
)

print("=" * 60)
print("  PREDICCION FNC HIBRIDA")
print("=" * 60)


parser = argparse.ArgumentParser(description="Genera una prediccion FNC hibrida.")
parser.add_argument(
    "--fecha-prediccion",
    help="Fecha objetivo en formato YYYY-MM-DD. Si no se envia, usa la proxima fecha habil FNC.",
)
args = parser.parse_args()


def redondear_cop(valor: float) -> int:
    return int(round(float(valor) / 100.0) * 100)


def clasificar_tendencia(variacion_pct: float, variacion_cop: float) -> str:
    if abs(variacion_cop) < 22000 or abs(variacion_pct) < 0.55:
        return "estable"
    if variacion_pct >= 0.55:
        return "sube"
    if variacion_pct <= -0.55:
        return "baja"
    return "estable"


def clasificar_confianza(
    holdout_mape: float,
    candidate_spread_pct: float,
    signal_strength: float,
    direction_prediction: str,
    direction_confidence: float,
    direction_margin: float,
) -> tuple[str, str, list[str]]:
    alertas = []
    riesgo_puntos = 0

    if holdout_mape >= 1.6:
        riesgo_puntos += 2
        alertas.append("Error reciente del modelo por encima del objetivo")
    elif holdout_mape >= 1.0:
        riesgo_puntos += 1
        alertas.append("Modelo en seguimiento: MAPE reciente supera 1%")

    if candidate_spread_pct >= 3.0:
        riesgo_puntos += 2
        alertas.append("Alta dispersion entre formula, Prophet e hibrido")
    elif candidate_spread_pct >= 1.6:
        riesgo_puntos += 1
        alertas.append("Senales mixtas entre motores de prediccion")

    if signal_strength >= 0.65:
        riesgo_puntos += 1
        alertas.append("Mercado con senal fuerte de KC/TRM")

    if direction_prediction == "estable" and candidate_spread_pct >= 2.4:
        riesgo_puntos += 1
        alertas.append("Tendencia estable con alta incertidumbre interna")
    elif direction_prediction in {"sube", "baja"} and (direction_confidence < 0.55 or direction_margin < 0.12):
        riesgo_puntos += 1
        alertas.append("Clasificador de direccion con confianza limitada")

    if riesgo_puntos >= 4:
        return "baja", "alto", alertas
    if riesgo_puntos >= 2:
        return "media", "medio", alertas
    return "alta", "bajo", alertas


def siguiente_fecha_habil_fnc(fecha: pd.Timestamp) -> pd.Timestamp:
    fecha_objetivo = pd.Timestamp(fecha).normalize() + pd.Timedelta(days=1)
    while fecha_objetivo.weekday() >= 5:
        fecha_objetivo += pd.Timedelta(days=1)
    return fecha_objetivo


def obtener_fila_prediccion(
    supervised_df: pd.DataFrame,
    fecha_objetivo: pd.Timestamp | None,
) -> tuple[pd.Series, pd.Timestamp, pd.Timestamp, bool]:
    if fecha_objetivo is None:
        fila = supervised_df.iloc[-1].copy()
        fecha_base = pd.Timestamp(fila["ds"]).normalize()
        fecha_original = pd.Timestamp(fila["ds_target"]).normalize()
        fecha_prediccion = siguiente_fecha_habil_fnc(fecha_base)
        return fila, fecha_base, fecha_prediccion, fecha_prediccion != fecha_original

    fecha_prediccion = pd.Timestamp(fecha_objetivo).normalize()
    filas_previas = supervised_df[pd.to_datetime(supervised_df["ds"]).dt.normalize() < fecha_prediccion]

    if filas_previas.empty:
        raise ValueError(
            f"No hay datos historicos anteriores a {fecha_prediccion.date()} para generar la prediccion."
        )

    fila = filas_previas.iloc[-1].copy()
    fecha_base = pd.Timestamp(fila["ds"]).normalize()
    fecha_original = pd.Timestamp(fila["ds_target"]).normalize()
    return fila, fecha_base, fecha_prediccion, fecha_prediccion != fecha_original


def calcular_retorno_mercado(df: pd.DataFrame, fecha_base: pd.Timestamp, columna_valor: str) -> tuple[float, int]:
    df = df.copy()
    df["ds"] = pd.to_datetime(df["ds"], format="mixed", errors="coerce").dt.normalize()
    df[columna_valor] = pd.to_numeric(df[columna_valor], errors="coerce")
    df = df.dropna(subset=["ds", columna_valor])
    df = df[df["ds"] <= fecha_base].sort_values("ds").drop_duplicates(subset=["ds"], keep="last")

    if len(df) < 2:
        return 0.0, 999

    ultimo = df.iloc[-1]
    previo = df.iloc[-2]
    retorno = ((float(ultimo[columna_valor]) - float(previo[columna_valor])) / float(previo[columna_valor])) * 100
    edad_dias = int((fecha_base - pd.Timestamp(ultimo["ds"]).normalize()).days)
    return float(retorno), edad_dias


def aplicar_ajuste_presion_mercado(
    selected_raw: float,
    ultimo_precio_fnc: float,
    kc_change_pct: float,
    trm_change_pct: float,
    variaciones_modelo: list[float],
) -> tuple[float, float, float, float]:
    # KC tiene mayor peso porque la FNC parte del Contrato C; TRM compensa, pero no debe tapar una caida fuerte de KC.
    presion_mercado = (0.72 * kc_change_pct) + (0.28 * trm_change_pct)
    direccion_presion = 1 if presion_mercado > 0 else -1 if presion_mercado < 0 else 0
    variaciones_relevantes = [v for v in variaciones_modelo if abs(v) >= 0.35]
    variaciones_alineadas = [v for v in variaciones_relevantes if direccion_presion and (v * direccion_presion) > 0]
    variaciones_opuestas = [v for v in variaciones_relevantes if direccion_presion and (v * direccion_presion) < 0]

    if not variaciones_relevantes:
        factor_presion = 0.25
    else:
        factor_presion = 0.25 + (0.75 * (len(variaciones_alineadas) / len(variaciones_relevantes)))

    promedio_modelos = sum(variaciones_modelo) / len(variaciones_modelo) if variaciones_modelo else 0.0
    if direccion_presion and (promedio_modelos * direccion_presion) < 0.5:
        factor_presion = min(factor_presion, 0.45)
    if variaciones_opuestas:
        factor_presion = max(0.20, factor_presion - 0.20)

    ajuste_pct = max(-0.022, min(0.022, presion_mercado * 0.34 * factor_presion / 100))
    precio_por_presion = ultimo_precio_fnc * (1 + ajuste_pct)

    if abs(presion_mercado) < 1.2:
        return selected_raw, presion_mercado, precio_por_presion, factor_presion

    if presion_mercado < 0:
        return min(selected_raw, precio_por_presion), presion_mercado, precio_por_presion, factor_presion

    return max(selected_raw, precio_por_presion), presion_mercado, precio_por_presion, factor_presion


print("\n1. Cargando artefactos...")
with PROPHET_MODEL_PATH.open("rb") as handle:
    prophet_model = pickle.load(handle)

with XGBOOST_MODEL_PATH.open("rb") as handle:
    xgb_model = pickle.load(handle)

formula_model_path = MODEL_DIR / "modelo_formula_xgboost.pkl"
formula_model = None
if formula_model_path.exists():
    with formula_model_path.open("rb") as handle:
        formula_model = pickle.load(handle)

direction_model = None
if DIRECTION_MODEL_PATH.exists():
    with DIRECTION_MODEL_PATH.open("rb") as handle:
        direction_model = pickle.load(handle)

with FEATURE_CONFIG_PATH.open("rb") as handle:
    config = pickle.load(handle)

metricas = load_json(METRICS_PATH, default={})
feature_cols = config["feature_cols"]
best_strategy = config.get("best_strategy", "hybrid")
recent_change_limit = float(config.get("recent_change_limit", 0.012))
base_weights = config.get("ensemble_weights", {"naive": 0.34, "prophet": 0.28, "hybrid": 0.26, "formula": 0.12})

print("\n2. Reconstruyendo contexto actual...")
base_df = build_daily_base()
supervised_df = build_supervised_frame(base_df)
fecha_objetivo = pd.Timestamp(args.fecha_prediccion).normalize() if args.fecha_prediccion else None
future_row, fecha_base, fecha_prediccion, se_salto_fin_semana = obtener_fila_prediccion(
    supervised_df,
    fecha_objetivo,
)
fecha_prediccion_original = pd.Timestamp(future_row["ds_target"]).normalize()
ultimo_precio_fnc = float(future_row["fnc_lag_1"])

future_row["ds_target"] = fecha_prediccion
future_row["dia_semana"] = fecha_prediccion.weekday()
future_row["mes"] = fecha_prediccion.month
future_row["dia_mes"] = fecha_prediccion.day
future_row["semana_anio"] = int(fecha_prediccion.isocalendar().week)
future_row["es_fin_de_semana"] = int(fecha_prediccion.weekday() >= 5)

prophet_input = pd.DataFrame(
    {
        "ds": [fecha_prediccion],
        "kc_centavos": [float(future_row["kc_centavos"])],
        "trm": [float(future_row["trm"])],
    }
)
prophet_forecast = prophet_model.predict(prophet_input).iloc[0]
prophet_yhat = float(prophet_forecast["yhat"])

future_features = pd.DataFrame([{**future_row.to_dict(), "prophet_yhat": prophet_yhat}])
future_features = future_features[feature_cols]
residual_prediction = float(xgb_model.predict(future_features)[0])
formula_residual_prediction = 0.0
if formula_model is not None:
    formula_residual_prediction = float(formula_model.predict(future_features)[0])

direction_prediction = "sin_modelo"
direction_confidence = 0.0
direction_margin = 0.0
direction_probabilities: dict[str, float] = {}
if direction_model is not None:
    proba = direction_model.predict_proba(future_features)[0]
    classes = [int(value) for value in direction_model.classes_]
    class_probs = {classes[index]: float(value) for index, value in enumerate(proba)}
    direction_probabilities = {
        DIRECTION_LABELS.get(label, str(label)): round(prob, 4)
        for label, prob in class_probs.items()
    }
    ordered_probs = sorted(class_probs.items(), key=lambda item: item[1], reverse=True)
    top_label, top_prob = ordered_probs[0]
    second_prob = ordered_probs[1][1] if len(ordered_probs) > 1 else 0.0
    direction_prediction = DIRECTION_LABELS.get(top_label, str(top_label))
    direction_confidence = float(top_prob)
    direction_margin = float(top_prob - second_prob)

forecast_candidates = {
    "naive": float(future_row["fnc_lag_1"]),
    "prophet": prophet_yhat,
    "hybrid": prophet_yhat + residual_prediction,
    "formula": float(future_row["precio_formula_ajustada"]) + formula_residual_prediction,
}
for candidate_name in forecast_candidates:
    base_weights.setdefault(candidate_name, 0.0)
kc_change_pct_modelo = float(future_row.get("kc_retorno_1d", 0.0) or 0.0) * 100
trm_change_pct_modelo = float(future_row.get("trm_retorno_1d", 0.0) or 0.0) * 100
kc_change_pct_mercado, kc_edad_dias = calcular_retorno_mercado(load_clean_kc(), fecha_base, "kc_centavos")
trm_change_pct_mercado, trm_edad_dias = calcular_retorno_mercado(load_clean_trm(), fecha_base, "trm")
kc_change_pct = kc_change_pct_mercado if kc_edad_dias <= 3 else kc_change_pct_modelo
trm_change_pct = trm_change_pct_mercado if trm_edad_dias <= 3 else trm_change_pct_modelo
signal_strength = compute_market_signal_strength(kc_change_pct, trm_change_pct)
dynamic_weights = adjust_weights_for_signal(base_weights, kc_change_pct, trm_change_pct)

selected_raw = (
    forecast_candidates["naive"] * dynamic_weights.get("naive", 0.0)
    + forecast_candidates["prophet"] * dynamic_weights.get("prophet", 0.0)
    + forecast_candidates["hybrid"] * dynamic_weights.get("hybrid", 0.0)
    + forecast_candidates["formula"] * dynamic_weights.get("formula", 0.0)
)

if best_strategy in {"prophet", "hybrid", "formula"} and signal_strength < 0.25:
    selected_raw = (0.7 * selected_raw) + (0.3 * forecast_candidates[best_strategy])

prophet_variacion = ((prophet_yhat - ultimo_precio_fnc) / ultimo_precio_fnc) * 100
hybrid_value = forecast_candidates["hybrid"]
hybrid_variacion = ((hybrid_value - ultimo_precio_fnc) / ultimo_precio_fnc) * 100
formula_value = forecast_candidates["formula"]
formula_variacion = ((formula_value - ultimo_precio_fnc) / ultimo_precio_fnc) * 100
selected_variacion_pre_presion = ((selected_raw - ultimo_precio_fnc) / ultimo_precio_fnc) * 100
candidate_spread_pct = max(prophet_variacion, hybrid_variacion, formula_variacion) - min(
    prophet_variacion,
    hybrid_variacion,
    formula_variacion,
)

selected_raw, presion_mercado, precio_por_presion, factor_presion = aplicar_ajuste_presion_mercado(
    selected_raw,
    ultimo_precio_fnc,
    kc_change_pct,
    trm_change_pct,
    [prophet_variacion, hybrid_variacion, formula_variacion, selected_variacion_pre_presion],
)

ajuste_direccion_cop = 0.0
if direction_prediction in {"sube", "baja"} and direction_confidence >= 0.48 and direction_margin >= 0.10:
    direction_sign = 1 if direction_prediction == "sube" else -1
    selected_delta = selected_raw - ultimo_precio_fnc
    min_direction_delta = max(22000.0, ultimo_precio_fnc * 0.0075)
    ajuste_direccion_cop = min_direction_delta * (0.55 + direction_margin)
    objetivo_direccion = ultimo_precio_fnc + (direction_sign * ajuste_direccion_cop)

    if direction_sign > 0 and selected_delta < ajuste_direccion_cop:
        selected_raw = (0.65 * selected_raw) + (0.35 * objetivo_direccion)
    elif direction_sign < 0 and selected_delta > -ajuste_direccion_cop:
        selected_raw = (0.65 * selected_raw) + (0.35 * objetivo_direccion)

es_fin_de_semana = fecha_prediccion.weekday() >= 5
if es_fin_de_semana:
    selected_raw = ultimo_precio_fnc
    ajuste_direccion_cop = 0.0

limite_cambio = max(recent_change_limit, 0.025 if abs(presion_mercado) >= 3.0 and factor_presion >= 0.55 else recent_change_limit)
minimo_seguro = ultimo_precio_fnc * (1 - limite_cambio)
maximo_seguro = ultimo_precio_fnc * (1 + limite_cambio)
precio_estimado = max(min(selected_raw, maximo_seguro), minimo_seguro)
precio_estimado = int(round(precio_estimado / 100.0) * 100)

variacion = ((precio_estimado - ultimo_precio_fnc) / ultimo_precio_fnc) * 100
tendencia = clasificar_tendencia(variacion, precio_estimado - ultimo_precio_fnc)
holdout = metricas.get("metricas", {}).get("holdout", {})
base_holdout_key = f"mape_{best_strategy}"
base_mae_key = f"mae_{best_strategy}"
applied_strategy = "ensemble_ponderado"
holdout_key = "mape_ensemble" if "mape_ensemble" in holdout else base_holdout_key
mae_key = "mae_ensemble" if "mae_ensemble" in holdout else base_mae_key
mae_holdout = float(holdout.get(mae_key, 0.0) or 0.0)
holdout_mape_actual = float(holdout.get(holdout_key, 0.0) or 0.0)
mae_holdout = mae_holdout * (1 + (0.35 * (1 - factor_presion)))
if direction_prediction == "estable" and candidate_spread_pct >= 1.2:
    mae_holdout = mae_holdout * (1 + min(0.30, candidate_spread_pct * 0.08))

if best_strategy == "prophet":
    precio_minimo = max(float(prophet_forecast["yhat_lower"]), precio_estimado - mae_holdout)
    precio_maximo = min(float(prophet_forecast["yhat_upper"]), precio_estimado + mae_holdout)
else:
    precio_minimo = precio_estimado - mae_holdout
    precio_maximo = precio_estimado + mae_holdout

precio_minimo = redondear_cop(max(0.0, precio_minimo))
precio_maximo = redondear_cop(max(precio_minimo, precio_maximo))
if es_fin_de_semana:
    precio_minimo = precio_estimado
    precio_maximo = precio_estimado

confianza, nivel_riesgo, alertas = clasificar_confianza(
    holdout_mape_actual,
    candidate_spread_pct,
    signal_strength,
    direction_prediction,
    direction_confidence,
    direction_margin,
)

if es_fin_de_semana:
    explicacion = (
        "Fin de semana: la FNC no publica nuevo precio porque no opera la Bolsa de Nueva York, "
        "por eso se conserva el ultimo precio oficial disponible."
    )
elif se_salto_fin_semana:
    explicacion = (
        "Proxima jornada habil FNC: se omite sabado y domingo porque no hay nuevo cierre de la Bolsa de Nueva York. "
        "La prediccion apunta al lunes con las ultimas senales disponibles de KC/TRM."
    )
elif abs(ajuste_direccion_cop) > 0:
    explicacion = (
        f"El clasificador de direccion detecta mayor probabilidad de {direction_prediction}; "
        "por eso se aplica un ajuste suave sobre el ensamble para mejorar subidas/bajas sin romper el rango."
    )
elif nivel_riesgo == "alto":
    explicacion = (
        "Prediccion con incertidumbre alta: los motores internos no coinciden lo suficiente, "
        "por eso se recomienda interpretar principalmente el rango y no una direccion puntual."
    )
elif presion_mercado <= -2.0:
    if factor_presion < 0.55:
        explicacion = (
            "KC muestra presion bajista, pero formula, Prophet e hibrido no confirman una baja fuerte; "
            "por eso el ajuste se amortigua para evitar sobre-reaccionar."
        )
    else:
        explicacion = (
            "La salida fue ajustada por presion bajista de mercado: KC cae con mas fuerza que el soporte de TRM, "
            "por eso el modelo reduce la proyeccion final."
        )
elif presion_mercado >= 2.0:
    explicacion = (
        "La salida fue ajustada por presion alcista de mercado: KC/TRM muestran impulso suficiente "
        "para mover la proyeccion final."
    )
elif signal_strength >= 0.55:
    explicacion = (
        "La prediccion final usa un ensamble ponderado con ajuste por senales fuertes de KC/TRM, "
        "reduciendo el peso de replicar el ultimo FNC."
    )
elif best_strategy == "formula":
    explicacion = (
        "La estrategia base usa formula de mercado KC/TRM y el modelo solo corrige el residuo historico."
    )
elif best_strategy == "naive":
    explicacion = (
        "La base historica sigue favoreciendo continuidad, pero la salida final ahora usa "
        "un ensamble ponderado para no depender solo de replicar el ultimo FNC."
    )
elif best_strategy == "prophet":
    explicacion = (
        "La estrategia seleccionada fue prophet porque su tendencia temporal con KC y TRM "
        "mostro el menor error holdout reciente."
    )
else:
    explicacion = (
        "La estrategia seleccionada fue hybrid porque la combinacion de Prophet y XGBoost "
        "mostro el menor error holdout reciente."
    )

payload = {
    "fecha_actual": str(fecha_base.date()),
    "precio_actual_fnc": int(round(ultimo_precio_fnc)),
    "fecha_prediccion": str(fecha_prediccion.date()),
    "fecha_prediccion_original": str(fecha_prediccion_original.date()),
    "salto_fin_semana": bool(se_salto_fin_semana),
    "precio_estimado": int(precio_estimado),
    "precio_minimo": int(precio_minimo),
    "precio_maximo": int(precio_maximo),
    "variacion_porcentual": round(float(variacion), 2),
    "tendencia": tendencia,
    "confianza": confianza,
    "nivel_riesgo": nivel_riesgo,
    "alertas": alertas,
    "modelo": "fnc_hibrido",
    "estrategia_base": best_strategy,
    "estrategia_aplicada": applied_strategy,
    "holdout_mape": holdout.get(holdout_key),
    "holdout_mae": round(mae_holdout, 2),
    "explicacion": explicacion,
    "senales_modelo": {
        "ultimo_fnc": int(round(ultimo_precio_fnc)),
        "kc_variacion_pct": round(float(kc_change_pct), 2),
        "kc_variacion_pct_modelo": round(float(kc_change_pct_modelo), 2),
        "kc_edad_dias": int(kc_edad_dias),
        "trm_variacion_pct": round(float(trm_change_pct), 2),
        "trm_variacion_pct_modelo": round(float(trm_change_pct_modelo), 2),
        "trm_edad_dias": int(trm_edad_dias),
        "presion_mercado": round(float(presion_mercado), 2),
        "precio_por_presion": redondear_cop(precio_por_presion),
        "factor_presion": round(float(factor_presion), 3),
        "direccion_modelo": direction_prediction,
        "direccion_confianza": round(float(direction_confidence), 3),
        "direccion_margen": round(float(direction_margin), 3),
        "direccion_probabilidades": direction_probabilities,
        "ajuste_direccion_cop": redondear_cop(ajuste_direccion_cop),
        "dispersion_motores_pct": round(float(candidate_spread_pct), 2),
        "limite_cambio_pct": round(float(limite_cambio * 100), 2),
        "fuerza_senal": round(float(signal_strength), 3),
        "pesos_ensamble": dynamic_weights,
        "prophet_bruto": redondear_cop(prophet_yhat),
        "prophet_variacion_pct": round(float(prophet_variacion), 2),
        "residual_xgboost": redondear_cop(residual_prediction),
        "hybrid_bruto": redondear_cop(hybrid_value),
        "hybrid_variacion_pct": round(float(hybrid_variacion), 2),
        "formula_bruto": redondear_cop(formula_value),
        "formula_variacion_pct": round(float(formula_variacion), 2),
        "formula_residual_xgboost": redondear_cop(formula_residual_prediction),
    },
}

save_json(PREDICTION_JSON_PATH, payload)

history_row = {
    "fecha_generacion": str(fecha_base.date()),
    "fecha_prediccion": str(fecha_prediccion.date()),
    "fecha_prediccion_original": str(fecha_prediccion_original.date()),
    "precio_actual_fnc": int(round(ultimo_precio_fnc)),
    "precio_estimado": int(precio_estimado),
    "precio_minimo": int(precio_minimo),
    "precio_maximo": int(precio_maximo),
    "variacion_porcentual": round(float(variacion), 2),
    "tendencia": tendencia,
    "modelo": "fnc_hibrido",
    "estrategia": applied_strategy,
    "estrategia_base": best_strategy,
    "confianza": confianza,
    "nivel_riesgo": nivel_riesgo,
    "salto_fin_semana": int(se_salto_fin_semana),
    "presion_mercado": round(float(presion_mercado), 2),
    "factor_presion": round(float(factor_presion), 3),
    "direccion_modelo": direction_prediction,
    "direccion_confianza": round(float(direction_confidence), 3),
    "ajuste_direccion_cop": redondear_cop(ajuste_direccion_cop),
    "holdout_mape": holdout.get(holdout_key),
    "holdout_mae": round(mae_holdout, 2),
}

if PREDICTION_HISTORY_PATH.exists():
    df_historial = pd.read_csv(PREDICTION_HISTORY_PATH)
else:
    df_historial = pd.DataFrame(columns=list(history_row.keys()))

mask = (
    (df_historial["fecha_generacion"].astype(str) == history_row["fecha_generacion"])
    & (df_historial["fecha_prediccion"].astype(str) == history_row["fecha_prediccion"])
) if not df_historial.empty else pd.Series(dtype=bool)

if not df_historial.empty and mask.any():
    for column, value in history_row.items():
        df_historial.loc[mask, column] = value
else:
    df_historial = pd.concat([df_historial, pd.DataFrame([history_row])], ignore_index=True)

df_historial = df_historial.sort_values(["fecha_generacion", "fecha_prediccion"])
df_historial.to_csv(PREDICTION_HISTORY_PATH, index=False)
df_historial.to_csv(BACKEND_PREDICTION_HISTORY_PATH, index=False)

print("\n3. Prediccion generada")
print(f"   Fecha base: {fecha_base.date()}")
print(f"   Fecha prediccion: {fecha_prediccion.date()}")
print(f"   Ultimo FNC real: ${ultimo_precio_fnc:,.0f}")
print(f"   Prophet bruto: ${prophet_yhat:,.0f}")
print(f"   Residual XGB: ${residual_prediction:,.0f}")
print(f"   Formula bruto: ${formula_value:,.0f}")
print(f"   Residual formula XGB: ${formula_residual_prediction:,.0f}")
print(f"   Estrategia base: {best_strategy}")
print(f"   Estrategia aplicada: {applied_strategy}")
print(f"   KC variacion 1d: {kc_change_pct:+.2f}%")
print(f"   TRM variacion 1d: {trm_change_pct:+.2f}%")
print(f"   Fuerza de senal: {signal_strength:.3f}")
print(f"   Direccion modelo: {direction_prediction} ({direction_confidence:.2f}, margen {direction_margin:.2f})")
print(f"   Ajuste direccion: ${ajuste_direccion_cop:,.0f}")
print(f"   Prediccion final: ${precio_estimado:,.0f}")
print(f"   Rango estimado: ${precio_minimo:,.0f} - ${precio_maximo:,.0f}")
print(f"   Variacion: {variacion:+.2f}%")
print(f"   Tendencia: {tendencia}")
print(f"   Confianza: {confianza} | Riesgo: {nivel_riesgo}")
if alertas:
    print(f"   Alertas: {'; '.join(alertas)}")
print(f"   Explicacion: {explicacion}")
print(f"\nOK: JSON guardado en {PREDICTION_JSON_PATH}")
print(f"OK: historial actualizado en {PREDICTION_HISTORY_PATH}")
print(f"OK: historial publico actualizado en {BACKEND_PREDICTION_HISTORY_PATH}")
print("=" * 60)
