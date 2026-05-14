from __future__ import annotations

import pickle

import pandas as pd
import xgboost as xgb
from prophet import Prophet

from pipeline_fnc_hibrido import (
    FEATURE_CONFIG_PATH,
    METRICS_PATH,
    MODEL_DIR,
    PROPHET_MODEL_PATH,
    PROPHET_REGRESSORS,
    XGBOOST_MODEL_PATH,
    build_daily_base,
    build_supervised_frame,
    choose_primary_strategy,
    compute_strategy_weights,
    compute_recent_change_limit,
    feature_columns,
    mae,
    make_prophet_frame,
    mape,
    prepare_training_frame,
    save_json,
    train_test_split_temporal,
)

print("=" * 60)
print("  ENTRENAMIENTO FNC HIBRIDO")
print("=" * 60)

print("\n1. Cargando dataset base...")
base_df = build_daily_base()
print(f"   Registros base: {len(base_df)}")
print(f"   Rango base: {base_df['ds'].min().date()} a {base_df['ds'].max().date()}")

supervised_df = build_supervised_frame(base_df)
prophet_source = make_prophet_frame(supervised_df)
print(f"   Registros supervisados: {len(prophet_source)}")

if len(prophet_source) < 45:
    raise SystemExit("No hay suficientes datos para entrenar un modelo usable.")

train_prophet, test_prophet = train_test_split_temporal(prophet_source)
print(f"   Train temporal: {len(train_prophet)}")
print(f"   Test temporal : {len(test_prophet)}")

print("\n2. Entrenando Prophet base...")
prophet_model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    changepoint_prior_scale=0.08,
    seasonality_prior_scale=8.0,
    interval_width=0.8,
)
for regressor in PROPHET_REGRESSORS:
    prophet_model.add_regressor(regressor)

prophet_model.fit(train_prophet)

prophet_predictions_all = prophet_model.predict(prophet_source[["ds", *PROPHET_REGRESSORS]])[
    ["ds", "yhat", "yhat_lower", "yhat_upper"]
]

training_frame = prepare_training_frame(supervised_df, prophet_predictions_all)
train_frame = training_frame[training_frame["ds_target"].isin(train_prophet["ds"])].copy()
test_frame = training_frame[training_frame["ds_target"].isin(test_prophet["ds"])].copy()

if len(train_frame) < 30 or len(test_frame) < 10:
    raise SystemExit("El split temporal quedo demasiado corto despues de crear features.")

feature_cols = feature_columns()
residual_target_train = train_frame["y_target"] - train_frame["prophet_yhat"]
formula_target_train = train_frame["y_target"] - train_frame["precio_formula_ajustada"]

print("\n3. Entrenando corrector XGBoost sobre residuales...")
xgb_model = xgb.XGBRegressor(
    n_estimators=250,
    max_depth=4,
    learning_rate=0.04,
    subsample=0.85,
    colsample_bytree=0.85,
    reg_alpha=0.2,
    reg_lambda=1.2,
    objective="reg:squarederror",
    random_state=42,
)
xgb_model.fit(train_frame[feature_cols], residual_target_train)

formula_model = xgb.XGBRegressor(
    n_estimators=220,
    max_depth=3,
    learning_rate=0.04,
    subsample=0.9,
    colsample_bytree=0.9,
    reg_alpha=0.25,
    reg_lambda=1.4,
    objective="reg:squarederror",
    random_state=84,
)
formula_model.fit(train_frame[feature_cols], formula_target_train)

print("\n4. Evaluando estrategias...")
train_frame["pred_naive"] = train_frame["fnc_lag_1"]
train_frame["pred_prophet"] = train_frame["prophet_yhat"]
train_frame["pred_hybrid"] = train_frame["prophet_yhat"] + xgb_model.predict(train_frame[feature_cols])
train_frame["pred_formula"] = train_frame["precio_formula_ajustada"] + formula_model.predict(train_frame[feature_cols])

test_frame["pred_naive"] = test_frame["fnc_lag_1"]
test_frame["pred_prophet"] = test_frame["prophet_yhat"]
test_frame["pred_hybrid"] = test_frame["prophet_yhat"] + xgb_model.predict(test_frame[feature_cols])
test_frame["pred_formula"] = test_frame["precio_formula_ajustada"] + formula_model.predict(test_frame[feature_cols])

holdout_errors = {
    "naive": mape(test_frame["y_target"], test_frame["pred_naive"]),
    "prophet": mape(test_frame["y_target"], test_frame["pred_prophet"]),
    "hybrid": mape(test_frame["y_target"], test_frame["pred_hybrid"]),
    "formula": mape(test_frame["y_target"], test_frame["pred_formula"]),
}
ensemble_weights = compute_strategy_weights(holdout_errors, naive_penalty=0.92)
train_weights = compute_strategy_weights(
    {
        "naive": mape(train_frame["y_target"], train_frame["pred_naive"]),
        "prophet": mape(train_frame["y_target"], train_frame["pred_prophet"]),
        "hybrid": mape(train_frame["y_target"], train_frame["pred_hybrid"]),
        "formula": mape(train_frame["y_target"], train_frame["pred_formula"]),
    },
    naive_penalty=0.92,
)

train_frame["pred_ensemble"] = (
    train_frame["pred_naive"] * train_weights["naive"]
    + train_frame["pred_prophet"] * train_weights["prophet"]
    + train_frame["pred_hybrid"] * train_weights["hybrid"]
    + train_frame["pred_formula"] * train_weights["formula"]
)
test_frame["pred_ensemble"] = (
    test_frame["pred_naive"] * ensemble_weights["naive"]
    + test_frame["pred_prophet"] * ensemble_weights["prophet"]
    + test_frame["pred_hybrid"] * ensemble_weights["hybrid"]
    + test_frame["pred_formula"] * ensemble_weights["formula"]
)

metricas = {
    "train": {
        "mape_naive": round(mape(train_frame["y_target"], train_frame["pred_naive"]), 4),
        "mape_prophet": round(mape(train_frame["y_target"], train_frame["pred_prophet"]), 4),
        "mape_hybrid": round(mape(train_frame["y_target"], train_frame["pred_hybrid"]), 4),
        "mape_formula": round(mape(train_frame["y_target"], train_frame["pred_formula"]), 4),
        "mape_ensemble": round(mape(train_frame["y_target"], train_frame["pred_ensemble"]), 4),
        "mae_hybrid": round(mae(train_frame["y_target"], train_frame["pred_hybrid"]), 2),
        "mae_formula": round(mae(train_frame["y_target"], train_frame["pred_formula"]), 2),
        "mae_ensemble": round(mae(train_frame["y_target"], train_frame["pred_ensemble"]), 2),
    },
    "holdout": {
        "mape_naive": round(holdout_errors["naive"], 4),
        "mape_prophet": round(holdout_errors["prophet"], 4),
        "mape_hybrid": round(holdout_errors["hybrid"], 4),
        "mape_formula": round(holdout_errors["formula"], 4),
        "mape_ensemble": round(mape(test_frame["y_target"], test_frame["pred_ensemble"]), 4),
        "mae_naive": round(mae(test_frame["y_target"], test_frame["pred_naive"]), 2),
        "mae_prophet": round(mae(test_frame["y_target"], test_frame["pred_prophet"]), 2),
        "mae_hybrid": round(mae(test_frame["y_target"], test_frame["pred_hybrid"]), 2),
        "mae_formula": round(mae(test_frame["y_target"], test_frame["pred_formula"]), 2),
        "mae_ensemble": round(mae(test_frame["y_target"], test_frame["pred_ensemble"]), 2),
    },
}

estrategias = {
    "naive": metricas["holdout"]["mape_naive"],
    "prophet": metricas["holdout"]["mape_prophet"],
    "hybrid": metricas["holdout"]["mape_hybrid"],
    "formula": metricas["holdout"]["mape_formula"],
    "ensemble": metricas["holdout"]["mape_ensemble"],
}
best_strategy = choose_primary_strategy(
    {
        "naive": metricas["holdout"]["mape_naive"],
        "prophet": metricas["holdout"]["mape_prophet"],
        "hybrid": metricas["holdout"]["mape_hybrid"],
        "formula": metricas["holdout"]["mape_formula"],
    },
    naive_margin_pct=0.2,
)
if best_strategy == "ensemble":
    comparison = {
        "prophet": metricas["holdout"]["mape_prophet"],
        "hybrid": metricas["holdout"]["mape_hybrid"],
        "formula": metricas["holdout"]["mape_formula"],
        "ensemble": metricas["holdout"]["mape_ensemble"],
    }
    best_strategy = min(comparison, key=comparison.get)

print(f"   Holdout MAPE naive  : {metricas['holdout']['mape_naive']:.3f}%")
print(f"   Holdout MAPE prophet: {metricas['holdout']['mape_prophet']:.3f}%")
print(f"   Holdout MAPE hybrid : {metricas['holdout']['mape_hybrid']:.3f}%")
print(f"   Holdout MAPE formula: {metricas['holdout']['mape_formula']:.3f}%")
print(f"   Holdout MAPE ensemble: {metricas['holdout']['mape_ensemble']:.3f}%")
print(f"   Estrategia ganadora : {best_strategy}")

print("\n5. Reentrenando modelos finales con todos los datos...")
final_prophet = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    changepoint_prior_scale=0.08,
    seasonality_prior_scale=8.0,
    interval_width=0.8,
)
for regressor in PROPHET_REGRESSORS:
    final_prophet.add_regressor(regressor)
final_prophet.fit(prophet_source)

prophet_full_predictions = final_prophet.predict(prophet_source[["ds", *PROPHET_REGRESSORS]])[
    ["ds", "yhat", "yhat_lower", "yhat_upper"]
]
final_frame = prepare_training_frame(supervised_df, prophet_full_predictions)
final_residual = final_frame["y_target"] - final_frame["prophet_yhat"]
final_formula_residual = final_frame["y_target"] - final_frame["precio_formula_ajustada"]

final_xgb = xgb.XGBRegressor(
    n_estimators=250,
    max_depth=4,
    learning_rate=0.04,
    subsample=0.85,
    colsample_bytree=0.85,
    reg_alpha=0.2,
    reg_lambda=1.2,
    objective="reg:squarederror",
    random_state=42,
)
final_xgb.fit(final_frame[feature_cols], final_residual)

final_formula_model = xgb.XGBRegressor(
    n_estimators=220,
    max_depth=3,
    learning_rate=0.04,
    subsample=0.9,
    colsample_bytree=0.9,
    reg_alpha=0.25,
    reg_lambda=1.4,
    objective="reg:squarederror",
    random_state=84,
)
final_formula_model.fit(final_frame[feature_cols], final_formula_residual)

recent_change_limit = compute_recent_change_limit(base_df)
estado_modelo = "usable" if estrategias[best_strategy] <= 1.0 else "seguir_en_pruebas"

reporte = {
    "estrategia_seleccionada": best_strategy,
    "estado_modelo": estado_modelo,
    "registros_base": int(len(base_df)),
    "registros_supervisados": int(len(final_frame)),
    "rango_entrenamiento": {
        "desde": str(base_df["ds"].min().date()),
        "hasta": str(base_df["ds"].max().date()),
    },
    "max_cambio_diario_permitido": round(recent_change_limit, 5),
    "ensemble_weights": ensemble_weights,
    "metricas": metricas,
}

print("\n6. Guardando artefactos...")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

with PROPHET_MODEL_PATH.open("wb") as handle:
    pickle.dump(final_prophet, handle)

with XGBOOST_MODEL_PATH.open("wb") as handle:
    pickle.dump(final_xgb, handle)

with (MODEL_DIR / "modelo_formula_xgboost.pkl").open("wb") as handle:
    pickle.dump(final_formula_model, handle)

with FEATURE_CONFIG_PATH.open("wb") as handle:
    pickle.dump(
        {
            "feature_cols": feature_cols,
            "prophet_regressors": PROPHET_REGRESSORS,
            "best_strategy": best_strategy,
            "recent_change_limit": recent_change_limit,
            "ensemble_weights": ensemble_weights,
            "naive_margin_pct": 0.2,
        },
        handle,
    )

save_json(METRICS_PATH, reporte)

print("OK: modelos y metricas guardados")
print(f"   Modelo listo?: {estado_modelo}")
print("=" * 60)
