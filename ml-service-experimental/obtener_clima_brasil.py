from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
import requests

from pipeline_fnc_hibrido import DATA_DIR

print("=" * 50)
print("OBTENIENDO CLIMA BRASIL")
print("=" * 50)

REGIONES_CAFE = [
    {"nombre": "Sul de Minas", "lat": -21.78, "lon": -45.93},
    {"nombre": "Cerrado Mineiro", "lat": -18.94, "lon": -47.46},
    {"nombre": "Mogiana", "lat": -21.17, "lon": -47.81},
]


def consultar_open_meteo(url: str, params: dict) -> dict:
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def resumir_dia(df_hourly: pd.DataFrame) -> pd.DataFrame:
    df_hourly["ds"] = pd.to_datetime(df_hourly["time"]).dt.normalize()
    resumen = (
        df_hourly.groupby("ds", as_index=False)
        .agg(
            temp_min=("temperature_2m", "min"),
            temp_max=("temperature_2m", "max"),
            lluvia_mm=("precipitation", "sum"),
            humedad_media=("relative_humidity_2m", "mean"),
            humedad_suelo=("soil_moisture_0_to_1cm", "mean"),
        )
    )
    return resumen


def score_climatico(df_daily: pd.DataFrame) -> pd.DataFrame:
    df = df_daily.copy()
    # Riesgo de helada, sequia o lluvia excesiva.
    score = (
        (df["temp_min"] <= 2.0).astype(float) * 1.0
        + (df["temp_min"].between(2.0, 5.0)).astype(float) * 0.5
        + (df["lluvia_mm"] >= 35.0).astype(float) * 0.6
        + ((df["lluvia_mm"] <= 1.0) & (df["humedad_suelo"] <= 0.18)).astype(float) * 0.7
        + ((df["temp_max"] >= 33.0) & (df["humedad_suelo"] <= 0.20)).astype(float) * 0.5
    )
    df["clima_brasil_intensidad"] = score.clip(lower=0.0, upper=1.0).round(3)
    df["clima_brasil_alerta"] = (df["clima_brasil_intensidad"] >= 0.45).astype(int)
    return df[["ds", "clima_brasil_alerta", "clima_brasil_intensidad"]]


def obtener_clima_region(region: dict, start_date: str, end_date: str) -> pd.DataFrame:
    archive_payload = consultar_open_meteo(
        "https://archive-api.open-meteo.com/v1/archive",
        {
            "latitude": region["lat"],
            "longitude": region["lon"],
            "start_date": start_date,
            "end_date": end_date,
            "timezone": "America/Sao_Paulo",
            "hourly": "temperature_2m,precipitation,relative_humidity_2m,soil_moisture_0_to_1cm",
        },
    )

    forecast_payload = consultar_open_meteo(
        "https://api.open-meteo.com/v1/forecast",
        {
            "latitude": region["lat"],
            "longitude": region["lon"],
            "forecast_days": 7,
            "timezone": "America/Sao_Paulo",
            "hourly": "temperature_2m,precipitation,relative_humidity_2m,soil_moisture_0_to_1cm",
        },
    )

    archive_hourly = pd.DataFrame(archive_payload["hourly"])
    forecast_hourly = pd.DataFrame(forecast_payload["hourly"])

    df = pd.concat([resumir_dia(archive_hourly), resumir_dia(forecast_hourly)], ignore_index=True)
    df = df.sort_values("ds").drop_duplicates(subset=["ds"], keep="last")
    return score_climatico(df)


def construir_clima_brasil() -> pd.DataFrame:
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)

    frames = []
    for region in REGIONES_CAFE:
        try:
            frames.append(obtener_clima_region(region, start_date.isoformat(), end_date.isoformat()))
        except Exception as exc:
            print(f"ADVERTENCIA: fallo clima para {region['nombre']}: {exc}")

    if not frames:
        raise RuntimeError("No se pudo obtener clima real desde Open-Meteo.")

    df = pd.concat(frames, ignore_index=True)
    df = (
        df.groupby("ds", as_index=False)
        .agg(
            clima_brasil_alerta=("clima_brasil_alerta", "max"),
            clima_brasil_intensidad=("clima_brasil_intensidad", "mean"),
        )
        .sort_values("ds")
    )
    df["clima_brasil_intensidad"] = df["clima_brasil_intensidad"].round(3)
    return df


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = construir_clima_brasil()
    output_path = DATA_DIR / "clima_brasil.csv"
    df.to_csv(output_path, index=False)
    print(f"OK: clima Brasil actualizado con {len(df)} registros")
    print(f"   Rango: {df['ds'].min().date()} a {df['ds'].max().date()}")
    print(f"   Dias con alerta: {int(df['clima_brasil_alerta'].sum())}")
