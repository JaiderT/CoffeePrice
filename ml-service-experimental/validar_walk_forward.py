from __future__ import annotations

import numpy as np
import pandas as pd
import xgboost as xgb
from prophet import Prophet

from pipeline_fnc_hibrido import (
    PROPHET_REGRESSORS,
    build_daily_base,
    build_supervised_frame,
    feature_columns,
    make_prophet_frame,
    mae,
    mape,
    prepare_training_frame,
    walk_forward_splits,
)

print("=" * 60)
print("  VALIDACION WALK-FORWARD (multiples cortes temporales)")
print("=" * 60)
print(
    "Objetivo: con ~400 registros, un solo split de 14-21 dias da metricas\n"
    "ruidosas. Este script promedia varios cortes para saber que tan\n"
    "confiable es realmente cada estrategia antes de marcar el modelo\n"
    "como 'usable'.\n"
)

base_df = build_daily_base()
supervised_df = build_supervised_frame(base_df)
prophet_source = make_prophet_frame(supervised_df)

folds = walk_forward_splits(prophet_source, n_splits=5, test_window_days=14, min_train_days=90)
if not folds:
    raise SystemExit(
        "No hay suficiente historico para walk-forward (se necesitan minimo "
        "90 dias de train + 14 de test por fold). Ejecuta esto de nuevo "
        "cuando haya mas datos acumulados."
    )

print(f"Folds generados: {len(folds)}")

feature_cols = feature_columns()
resultados = []

for i, (train_prophet, test_prophet) in enumerate(folds, start=1):
    print(f"\n--- Fold {i}/{len(folds)} ---")
    print(f"  Train: {train_prophet['ds'].min().date()} a {train_prophet['ds'].max().date()} ({len(train_prophet)} dias)")
    print(f"  Test : {test_prophet['ds'].min().date()} a {test_prophet['ds'].max().date()} ({len(test_prophet)} dias)")

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

    full_fold_source = pd.concat([train_prophet, test_prophet], ignore_index=True)
    prophet_predictions = prophet_model.predict(full_fold_source[["ds", *PROPHET_REGRESSORS]])[
        ["ds", "yhat", "yhat_lower", "yhat_upper"]
    ]

    training_frame = prepare_training_frame(supervised_df, prophet_predictions)
    train_frame = training_frame[training_frame["ds_target"].isin(train_prophet["ds"])].copy()
    test_frame = training_frame[training_frame["ds_target"].isin(test_prophet["ds"])].copy()

    if len(train_frame) < 30 or test_frame.empty:
        print("  Fold omitido: muy pocos registros tras construir features.")
        continue

    residual_target_train = train_frame["y_target"] - train_frame["prophet_yhat"]
    formula_target_train = train_frame["y_target"] - train_frame["precio_formula_ajustada"]

    xgb_model = xgb.XGBRegressor(
        n_estimators=250, max_depth=4, learning_rate=0.04, subsample=0.85,
        colsample_bytree=0.85, reg_alpha=0.2, reg_lambda=1.2,
        objective="reg:squarederror", random_state=42,
    )
    xgb_model.fit(train_frame[feature_cols], residual_target_train)

    formula_model = xgb.XGBRegressor(
        n_estimators=220, max_depth=3, learning_rate=0.04, subsample=0.9,
        colsample_bytree=0.9, reg_alpha=0.25, reg_lambda=1.4,
        objective="reg:squarederror", random_state=84,
    )
    formula_model.fit(train_frame[feature_cols], formula_target_train)

    direction_counts = train_frame["direccion_target"].astype(int).value_counts().to_dict()
    direction_classes = max(len(direction_counts), 1)
    direction_sample_weight = train_frame["direccion_target"].astype(int).map(
        lambda label: len(train_frame) / (direction_classes * direction_counts.get(int(label), 1))
    )
    direction_model = xgb.XGBClassifier(
        n_estimators=180, max_depth=3, learning_rate=0.045, subsample=0.9,
        colsample_bytree=0.9, reg_alpha=0.15, reg_lambda=1.4,
        objective="multi:softprob", eval_metric="mlogloss", random_state=126,
    )
    direction_model.fit(train_frame[feature_cols], train_frame["direccion_target"].astype(int), sample_weight=direction_sample_weight)

    test_frame["pred_naive"] = test_frame["fnc_lag_1"]
    test_frame["pred_prophet"] = test_frame["prophet_yhat"]
    test_frame["pred_hybrid"] = test_frame["prophet_yhat"] + xgb_model.predict(test_frame[feature_cols])
    test_frame["pred_formula"] = test_frame["precio_formula_ajustada"] + formula_model.predict(test_frame[feature_cols])
    test_frame["pred_direccion"] = direction_model.predict(test_frame[feature_cols])
    acc_direccion = float(
        (test_frame["pred_direccion"].astype(int) == test_frame["direccion_target"].astype(int)).mean() * 100
    )

    fold_result = {
        "fold": i,
        "mape_naive": mape(test_frame["y_target"], test_frame["pred_naive"]),
        "mape_prophet": mape(test_frame["y_target"], test_frame["pred_prophet"]),
        "mape_hybrid": mape(test_frame["y_target"], test_frame["pred_hybrid"]),
        "mape_formula": mape(test_frame["y_target"], test_frame["pred_formula"]),
        "accuracy_direccion": acc_direccion,
    }
    resultados.append(fold_result)
    print(
        f"  MAPE -> naive: {fold_result['mape_naive']:.3f}% | prophet: {fold_result['mape_prophet']:.3f}% | "
        f"hybrid: {fold_result['mape_hybrid']:.3f}% | formula: {fold_result['mape_formula']:.3f}%"
    )
    print(f"  Accuracy direccion: {acc_direccion:.1f}%")

print("\n" + "=" * 60)
print("  RESUMEN WALK-FORWARD (promedio +/- desviacion estandar)")
print("=" * 60)

if not resultados:
    raise SystemExit("Ningun fold pudo evaluarse.")

df_res = pd.DataFrame(resultados)
for col in ["mape_naive", "mape_prophet", "mape_hybrid", "mape_formula", "accuracy_direccion"]:
    print(f"  {col}: {df_res[col].mean():.3f} +/- {df_res[col].std():.3f}")

print(
    "\nComparar esta desviacion estandar contra el valor de un solo fold es\n"
    "la clave: si el promedio esta cerca de 1.0% pero la desviacion es alta\n"
    "(p.ej. +/- 1.5), significa que el modelo SI puede llegar a <1% en\n"
    "semanas normales, pero es fragil ante saltos de precio grandes (como el\n"
    "+4.8% del 2026-06-30). Ese es el escenario real, no un bug."
)
