from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "datos"
MODEL_DIR = BASE_DIR / "modelos"
BACKEND_DATA_DIR = BASE_DIR.parent / "backend" / "datos"

RAW_KC_FILES = [
    DATA_DIR / "Precios cafe.csv",
    DATA_DIR / "Precios_cafe.csv",
]
RAW_TRM_FILES = [
    DATA_DIR / "Tasa de cambio TRM.csv",
    DATA_DIR / "Tasa_de_cambio_TRM.csv",
]
MAX_RAW_FILE_BYTES = 50 * 1024 * 1024

CLEAN_KC_PATH = DATA_DIR / "precios_limpios.csv"
CLEAN_TRM_PATH = DATA_DIR / "trm_limpias.csv"
FNC_HISTORY_PATH = DATA_DIR / "precios_fnc_historicos.csv"
FNC_INDICATORS_PATH = DATA_DIR / "fnc_indicadores_diarios.csv"
EXTERNAL_VARS_PATH = DATA_DIR / "variables_externas.csv"
PREDICTION_JSON_PATH = BACKEND_DATA_DIR / "predicciones_fnc.json"
PREDICTION_HISTORY_PATH = DATA_DIR / "historial_predicciones_fnc.csv"
BACKEND_PREDICTION_HISTORY_PATH = BACKEND_DATA_DIR / "historial_predicciones_fnc.csv"
EVALUATION_HISTORY_PATH = DATA_DIR / "evaluacion_predicciones_fnc.csv"

PROPHET_MODEL_PATH = MODEL_DIR / "modelo_prophet_hibrido.pkl"
XGBOOST_MODEL_PATH = MODEL_DIR / "modelo_xgboost.pkl"
DIRECTION_MODEL_PATH = MODEL_DIR / "modelo_direccion_xgboost.pkl"
FEATURE_CONFIG_PATH = MODEL_DIR / "features_hibrido.pkl"
METRICS_PATH = MODEL_DIR / "metricas_fnc_hibrido.json"

LBS_POR_KG = 2.20462
KG_POR_CARGA = 125
LBS_POR_CARGA = LBS_POR_KG * KG_POR_CARGA

EXTERNAL_COLUMNS = [
    "petroleo_wti",
    "flete_fbx",
    "volumen_ice",
    "inventario_ice",
    "usd_brl",
    "clima_brasil_alerta",
    "clima_brasil_intensidad",
]

PROPHET_REGRESSORS = ["kc_centavos", "trm"]
DIRECTION_LABELS = {0: "baja", 1: "estable", 2: "sube"}


def ensure_directories() -> None:
    for directory in (DATA_DIR, MODEL_DIR, BACKEND_DATA_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def normalize_dates(values: pd.Series) -> pd.Series:
    return pd.to_datetime(values, format="mixed", errors="coerce").dt.normalize()


def parse_decimal(value) -> float:
    if pd.isna(value):
        return np.nan
    text = str(value).strip()
    if not text:
        return np.nan

    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        text = text.replace(".", "").replace(",", ".")

    try:
        return float(text)
    except ValueError:
        return np.nan


def load_json(path: Path, default: dict | list | None = None):
    if not path.exists():
        return {} if default is None else default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)


def _deduplicate_daily(df: pd.DataFrame, value_columns: Iterable[str]) -> pd.DataFrame:
    df = df.copy()
    df["ds"] = normalize_dates(df["ds"])
    for column in value_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df = df.dropna(subset=["ds", *value_columns])
    df = df.sort_values("ds")
    return df.drop_duplicates(subset=["ds"], keep="last").reset_index(drop=True)


def load_raw_kc() -> pd.DataFrame:
    frames = []
    if CLEAN_KC_PATH.exists():
        frames.append(pd.read_csv(CLEAN_KC_PATH))

    for path in RAW_KC_FILES:
        if not path.exists():
            continue
        if path.stat().st_size > MAX_RAW_FILE_BYTES:
            print(f"   ADVERTENCIA: se omite KC crudo pesado: {path.name}")
            continue
        df = pd.read_csv(path)
        rename_map = {}
        if "Date" in df.columns:
            rename_map["Date"] = "ds"
        if "Price" in df.columns:
            rename_map["Price"] = "y"
        df = df.rename(columns=rename_map)
        if {"ds", "y"} <= set(df.columns):
            frames.append(df[["ds", "y"]].copy())

    if not frames:
        raise FileNotFoundError("No se encontraron archivos fuente de KC.")

    df = pd.concat(frames, ignore_index=True)
    df["y"] = (
        df["y"]
        .astype(str)
        .str.replace(",", "", regex=False)
        .str.replace(" ", "", regex=False)
    )
    df = _deduplicate_daily(df, ["y"])
    return df[(df["y"] >= 50) & (df["y"] <= 500)].reset_index(drop=True)


def load_raw_trm() -> pd.DataFrame:
    frames = []
    if CLEAN_TRM_PATH.exists():
        frames.append(pd.read_csv(CLEAN_TRM_PATH, sep=";", decimal=","))

    for path in RAW_TRM_FILES:
        if not path.exists():
            continue
        if path.stat().st_size > MAX_RAW_FILE_BYTES:
            print(f"   ADVERTENCIA: se omite TRM crudo pesado: {path.name}")
            continue
        df = pd.read_csv(path)
        rename_map = {}
        if "Fecha (dd/mm/aaaa)" in df.columns:
            rename_map["Fecha (dd/mm/aaaa)"] = "ds"
        if "TRM" in df.columns:
            rename_map["TRM"] = "trm"
        df = df.rename(columns=rename_map)
        if {"ds", "trm"} <= set(df.columns):
            frames.append(df[["ds", "trm"]].copy())

    if not frames:
        raise FileNotFoundError("No se encontraron archivos fuente de TRM.")

    df = pd.concat(frames, ignore_index=True)
    df["trm"] = df["trm"].apply(parse_decimal)
    df = _deduplicate_daily(df, ["trm"])
    return df[(df["trm"] >= 2000) & (df["trm"] <= 6000)].reset_index(drop=True)


def save_clean_market_data(df_kc: pd.DataFrame, df_trm: pd.DataFrame) -> None:
    ensure_directories()
    df_kc.to_csv(CLEAN_KC_PATH, index=False)
    df_trm.to_csv(CLEAN_TRM_PATH, index=False, sep=";", decimal=",")


def load_clean_kc() -> pd.DataFrame:
    if not CLEAN_KC_PATH.exists():
        raise FileNotFoundError("No existe precios_limpios.csv. Ejecuta limpiar_datos.py")
    df = pd.read_csv(CLEAN_KC_PATH, parse_dates=["ds"])
    df = _deduplicate_daily(df, ["y"])
    return df.rename(columns={"y": "kc_centavos"})


def load_clean_trm() -> pd.DataFrame:
    if not CLEAN_TRM_PATH.exists():
        raise FileNotFoundError("No existe trm_limpias.csv. Ejecuta limpiar_datos.py")
    df = pd.read_csv(CLEAN_TRM_PATH, parse_dates=["ds"], sep=";", decimal=",")
    return _deduplicate_daily(df, ["trm"])


def load_fnc_history() -> pd.DataFrame:
    if not FNC_HISTORY_PATH.exists():
        raise FileNotFoundError("No existe precios_fnc_historicos.csv")
    df = pd.read_csv(FNC_HISTORY_PATH, parse_dates=["ds"])
    df = _deduplicate_daily(df, ["y"])
    return df.rename(columns={"y": "precio_fnc"})


def load_fnc_indicators() -> pd.DataFrame:
    columns = ["ds", "fnc_web_precio", "fnc_web_bolsa_ny", "fnc_web_trm", "fnc_web_mecic"]
    if not FNC_INDICATORS_PATH.exists():
        return pd.DataFrame(columns=columns)

    df = pd.read_csv(FNC_INDICATORS_PATH, parse_dates=["ds"])
    rename_map = {
        "precio_interno": "fnc_web_precio",
        "bolsa_ny": "fnc_web_bolsa_ny",
        "trm_fnc": "fnc_web_trm",
        "mecic": "fnc_web_mecic",
    }
    df = df.rename(columns=rename_map)
    for column in columns:
        if column not in df.columns:
            df[column] = np.nan
    df = _deduplicate_daily(df[columns], columns[1:])
    return df


def load_external_variables() -> pd.DataFrame:
    if not EXTERNAL_VARS_PATH.exists():
        raise FileNotFoundError("No existe variables_externas.csv")
    df = pd.read_csv(EXTERNAL_VARS_PATH, parse_dates=["ds"])
    df["ds"] = normalize_dates(df["ds"])
    for column in EXTERNAL_COLUMNS:
        if column not in df.columns:
            df[column] = 0.0
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df = df[["ds", *EXTERNAL_COLUMNS]].sort_values("ds")
    df = df.drop_duplicates(subset=["ds"], keep="last")
    df[EXTERNAL_COLUMNS] = df[EXTERNAL_COLUMNS].ffill().bfill()
    return df.reset_index(drop=True)


def build_daily_base() -> pd.DataFrame:
    df_fnc = load_fnc_history()
    df_kc = load_clean_kc()
    df_trm = load_clean_trm()
    df_vars = load_external_variables()
    df_fnc_indicators = load_fnc_indicators()

    df = df_fnc.merge(df_kc, on="ds", how="left")
    df = df.merge(df_trm, on="ds", how="left")
    df = df.merge(df_vars, on="ds", how="left")
    df = df.merge(df_fnc_indicators, on="ds", how="left")
    df = df.sort_values("ds").reset_index(drop=True)

    indicator_columns = ["fnc_web_precio", "fnc_web_bolsa_ny", "fnc_web_trm", "fnc_web_mecic"]
    numeric_columns = ["precio_fnc", "kc_centavos", "trm", *EXTERNAL_COLUMNS, *indicator_columns]
    df[numeric_columns] = df[numeric_columns].apply(pd.to_numeric, errors="coerce")
    df["fnc_web_precio"] = df["fnc_web_precio"].fillna(df["precio_fnc"])
    df["fnc_web_bolsa_ny"] = df["fnc_web_bolsa_ny"].fillna(df["kc_centavos"])
    df["fnc_web_trm"] = df["fnc_web_trm"].fillna(df["trm"])
    df["fnc_web_mecic"] = df["fnc_web_mecic"].fillna(0.0)
    df[numeric_columns] = df[numeric_columns].ffill().bfill()
    df = add_formula_columns(df)
    return add_calendar_columns(df)


def add_formula_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    base_formula = (df["kc_centavos"] / 100.0) * df["trm"] * LBS_POR_CARGA
    df["precio_formula_base"] = base_formula
    df["factor_formula_implicito"] = df["precio_fnc"] / base_formula.replace(0, np.nan)
    df["factor_formula_implicito"] = df["factor_formula_implicito"].replace([np.inf, -np.inf], np.nan).ffill().bfill()
    df["precio_formula_ajustada"] = df["precio_formula_base"] * df["factor_formula_implicito"].rolling(14, min_periods=3).median()
    df["precio_formula_ajustada"] = df["precio_formula_ajustada"].ffill().bfill()
    df["residuo_formula"] = df["precio_fnc"] - df["precio_formula_ajustada"]
    df["formula_retorno_1d"] = df["precio_formula_ajustada"].pct_change().replace([np.inf, -np.inf], np.nan)
    df["gap_formula_pct"] = (df["residuo_formula"] / df["precio_fnc"].replace(0, np.nan)).replace([np.inf, -np.inf], np.nan)
    df["factor_formula_retorno_1d"] = df["factor_formula_implicito"].pct_change().replace([np.inf, -np.inf], np.nan)
    df["gap_formula_delta_1d"] = df["gap_formula_pct"].diff()
    df["residuo_formula_delta_1d"] = df["residuo_formula"].diff()
    df["residuo_formula_delta_3d"] = df["residuo_formula"] - df["residuo_formula"].shift(3)
    return df


def add_calendar_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["dia_semana"] = df["ds"].dt.weekday
    df["mes"] = df["ds"].dt.month
    df["dia_mes"] = df["ds"].dt.day
    df["semana_anio"] = df["ds"].dt.isocalendar().week.astype(int)
    df["es_fin_de_semana"] = (df["dia_semana"] >= 5).astype(int)
    return df


def build_supervised_frame(base_df: pd.DataFrame) -> pd.DataFrame:
    df = base_df.copy().sort_values("ds").reset_index(drop=True)

    # Current-day known values used to predict next day's FNC.
    df["fnc_lag_1"] = df["precio_fnc"]
    df["fnc_lag_2"] = df["precio_fnc"].shift(1)
    df["fnc_lag_3"] = df["precio_fnc"].shift(2)
    df["fnc_lag_7"] = df["precio_fnc"].shift(6)
    df["fnc_ma_3"] = df["precio_fnc"].rolling(3).mean()
    df["fnc_ma_7"] = df["precio_fnc"].rolling(7).mean()
    df["fnc_volatilidad_7"] = df["precio_fnc"].rolling(7).std()
    df["fnc_retorno_1d"] = df["precio_fnc"].pct_change().replace([np.inf, -np.inf], np.nan)
    df["fnc_retorno_2d"] = df["precio_fnc"].pct_change(2).replace([np.inf, -np.inf], np.nan)
    df["fnc_delta_1d"] = df["precio_fnc"].diff()
    df["fnc_delta_2d"] = df["precio_fnc"] - df["precio_fnc"].shift(2)

    df["kc_lag_1"] = df["kc_centavos"]
    df["kc_lag_2"] = df["kc_centavos"].shift(1)
    df["kc_lag_3"] = df["kc_centavos"].shift(2)
    df["kc_ma_3"] = df["kc_centavos"].rolling(3).mean()
    df["kc_ma_7"] = df["kc_centavos"].rolling(7).mean()
    df["kc_retorno_1d"] = df["kc_centavos"].pct_change().replace([np.inf, -np.inf], np.nan)

    df["trm_lag_1"] = df["trm"]
    df["trm_lag_2"] = df["trm"].shift(1)
    df["trm_ma_3"] = df["trm"].rolling(3).mean()
    df["trm_ma_7"] = df["trm"].rolling(7).mean()
    df["trm_retorno_1d"] = df["trm"].pct_change().replace([np.inf, -np.inf], np.nan)
    df["fnc_web_bolsa_retorno_1d"] = df["fnc_web_bolsa_ny"].pct_change().replace([np.inf, -np.inf], np.nan)
    df["fnc_web_trm_retorno_1d"] = df["fnc_web_trm"].pct_change().replace([np.inf, -np.inf], np.nan)
    df["fnc_web_mecic_delta_1d"] = df["fnc_web_mecic"].diff()
    df["fnc_vs_formula_base_pct"] = (
        (df["precio_fnc"] - df["precio_formula_base"]) / df["precio_fnc"].replace(0, np.nan)
    ).replace([np.inf, -np.inf], np.nan)
    df["formula_lag_1"] = df["precio_formula_ajustada"]
    df["formula_lag_2"] = df["precio_formula_ajustada"].shift(1)
    df["formula_ma_3"] = df["precio_formula_ajustada"].rolling(3).mean()
    df["factor_formula_ma_7"] = df["factor_formula_implicito"].rolling(7).mean()
    df["residuo_formula_lag_1"] = df["residuo_formula"]
    df["residuo_formula_ma_7"] = df["residuo_formula"].rolling(7).mean()
    df["residuo_formula_delta_1d_lag"] = df["residuo_formula_delta_1d"]
    df["residuo_formula_delta_3d_lag"] = df["residuo_formula_delta_3d"]

    df["y_target"] = df["precio_fnc"].shift(-1)
    df["ds_target"] = df["ds"].shift(-1)
    df["direccion_target"] = [
        classify_direction_from_prices(actual, target)
        for actual, target in zip(df["precio_fnc"], df["y_target"])
    ]
    if not df.empty:
        df.loc[df.index[-1], "ds_target"] = df.loc[df.index[-1], "ds"] + pd.Timedelta(days=1)
    return df


def feature_columns() -> list[str]:
    return [
        "kc_centavos",
        "trm",
        *EXTERNAL_COLUMNS,
        "dia_semana",
        "mes",
        "dia_mes",
        "semana_anio",
        "es_fin_de_semana",
        "fnc_lag_1",
        "fnc_lag_2",
        "fnc_lag_3",
        "fnc_lag_7",
        "fnc_ma_3",
        "fnc_ma_7",
        "fnc_volatilidad_7",
        "fnc_retorno_1d",
        "fnc_retorno_2d",
        "fnc_delta_1d",
        "fnc_delta_2d",
        "kc_lag_1",
        "kc_lag_2",
        "kc_lag_3",
        "kc_ma_3",
        "kc_ma_7",
        "kc_retorno_1d",
        "trm_lag_1",
        "trm_lag_2",
        "trm_ma_3",
        "trm_ma_7",
        "trm_retorno_1d",
        "fnc_web_precio",
        "fnc_web_bolsa_ny",
        "fnc_web_trm",
        "fnc_web_mecic",
        "fnc_web_bolsa_retorno_1d",
        "fnc_web_trm_retorno_1d",
        "fnc_web_mecic_delta_1d",
        "fnc_vs_formula_base_pct",
        "precio_formula_base",
        "precio_formula_ajustada",
        "factor_formula_implicito",
        "factor_formula_retorno_1d",
        "formula_retorno_1d",
        "gap_formula_pct",
        "gap_formula_delta_1d",
        "formula_lag_1",
        "formula_lag_2",
        "formula_ma_3",
        "factor_formula_ma_7",
        "residuo_formula_lag_1",
        "residuo_formula_ma_7",
        "residuo_formula_delta_1d_lag",
        "residuo_formula_delta_3d_lag",
        "prophet_yhat",
    ]


def classify_direction_from_prices(precio_actual: float, precio_siguiente: float) -> int:
    if pd.isna(precio_actual) or pd.isna(precio_siguiente) or precio_actual == 0:
        return 1
    variacion_cop = float(precio_siguiente) - float(precio_actual)
    variacion_pct = (variacion_cop / float(precio_actual)) * 100
    if abs(variacion_cop) < 22000 or abs(variacion_pct) < 0.55:
        return 1
    return 2 if variacion_cop > 0 else 0


def prepare_training_frame(df_supervised: pd.DataFrame, prophet_predictions: pd.DataFrame) -> pd.DataFrame:
    df = df_supervised.merge(prophet_predictions, left_on="ds_target", right_on="ds", how="left", suffixes=("", "_prophet"))
    df = df.drop(columns=["ds"], errors="ignore")
    df = df.rename(
        columns={
            "yhat": "prophet_yhat",
            "yhat_lower": "prophet_yhat_lower",
            "yhat_upper": "prophet_yhat_upper",
        }
    )
    columns = ["ds_target", "y_target", "direccion_target", *feature_columns()]
    df = df[columns].copy()
    df = df.replace([np.inf, -np.inf], np.nan).dropna().sort_values("ds_target").reset_index(drop=True)
    return df


def make_prophet_frame(df_supervised: pd.DataFrame) -> pd.DataFrame:
    columns = ["ds_target", "y_target", *PROPHET_REGRESSORS]
    df = df_supervised[columns].copy()
    df = df.rename(columns={"ds_target": "ds", "y_target": "y"})
    return df.dropna().sort_values("ds").reset_index(drop=True)


def train_test_split_temporal(df: pd.DataFrame, min_test_days: int = 14) -> tuple[pd.DataFrame, pd.DataFrame]:
    if len(df) < 45:
        raise ValueError("No hay suficientes registros para un split temporal confiable.")
    test_size = max(min_test_days, int(round(len(df) * 0.2)))
    test_size = min(test_size, 21)
    if len(df) - test_size < 30:
        test_size = len(df) - 30
    if test_size < min_test_days:
        test_size = min_test_days
    split_idx = len(df) - test_size
    return df.iloc[:split_idx].copy(), df.iloc[split_idx:].copy()


def mape(y_true: pd.Series, y_pred: pd.Series) -> float:
    y_true = pd.Series(y_true, dtype=float)
    y_pred = pd.Series(y_pred, dtype=float)
    denominator = y_true.replace(0, np.nan).abs()
    values = ((y_true - y_pred).abs() / denominator) * 100
    return float(values.dropna().mean())


def mae(y_true: pd.Series, y_pred: pd.Series) -> float:
    return float((pd.Series(y_true, dtype=float) - pd.Series(y_pred, dtype=float)).abs().mean())


def compute_recent_change_limit(base_df: pd.DataFrame) -> float:
    changes = base_df["precio_fnc"].pct_change().abs().dropna().tail(30)
    if changes.empty:
        return 0.012
    quantile = float(changes.quantile(0.9))
    return min(0.03, max(0.008, quantile * 1.15))


def compute_strategy_weights(metric_map: dict[str, float], naive_penalty: float = 1.0) -> dict[str, float]:
    raw = {}
    for name, error in metric_map.items():
        safe_error = max(float(error), 0.05)
        raw[name] = 1.0 / safe_error

    if "naive" in raw:
        raw["naive"] *= naive_penalty

    total = sum(raw.values())
    if total <= 0:
        size = len(metric_map) or 1
        return {name: round(1.0 / size, 4) for name in metric_map}

    return {name: round(value / total, 4) for name, value in raw.items()}


def choose_primary_strategy(metric_map: dict[str, float], naive_margin_pct: float = 0.2) -> str:
    ordered = sorted(metric_map.items(), key=lambda item: item[1])
    if not ordered:
        return "ensemble"

    winner, winner_error = ordered[0]
    if winner != "naive":
        return winner

    non_naive = [item for item in ordered if item[0] != "naive"]
    if not non_naive:
        return "naive"

    next_name, next_error = non_naive[0]
    if abs(float(next_error) - float(winner_error)) <= naive_margin_pct:
        return "ensemble"
    return "naive"


def compute_market_signal_strength(kc_change_pct: float, trm_change_pct: float) -> float:
    kc_component = min(abs(float(kc_change_pct)) / 1.2, 2.0)
    trm_component = min(abs(float(trm_change_pct)) / 0.8, 2.0)
    strength = (0.65 * kc_component) + (0.35 * trm_component)
    return max(0.0, min(1.0, strength / 2.0))


def adjust_weights_for_signal(
    weights: dict[str, float],
    kc_change_pct: float,
    trm_change_pct: float,
) -> dict[str, float]:
    adjusted = {key: float(value) for key, value in weights.items()}
    signal_strength = compute_market_signal_strength(kc_change_pct, trm_change_pct)

    if signal_strength > 0:
        adjusted["naive"] = adjusted.get("naive", 0.0) * (1 - (0.75 * signal_strength))
        adjusted["hybrid"] = adjusted.get("hybrid", 0.0) * (1 + (0.55 * signal_strength))
        adjusted["prophet"] = adjusted.get("prophet", 0.0) * (1 + (0.35 * signal_strength))
        adjusted["formula"] = adjusted.get("formula", 0.0) * (1 + (0.65 * signal_strength))

    total = sum(adjusted.values())
    if total <= 0:
        size = len(adjusted) or 1
        return {name: round(1.0 / size, 4) for name in adjusted}

    return {name: round(value / total, 4) for name, value in adjusted.items()}
