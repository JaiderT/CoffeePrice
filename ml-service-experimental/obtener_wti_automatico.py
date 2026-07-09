from __future__ import annotations

import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pandas as pd
import requests

from pipeline_fnc_hibrido import DATA_DIR

print("=" * 50)
print("ACTUALIZANDO WTI (PETROLEO) DESDE YAHOO FINANCE")
print("=" * 50)

# NUEVO (2026-07-03): antes "petroleo_wti" era una constante fija (78.5) en
# variables_externas.py con el comentario "Proxy variable while the sources
# are still experimental". Este script obtiene el precio real del futuro de
# WTI (ticker CL=F) usando el mismo endpoint publico de Yahoo Finance que ya
# se usa para KC=F en obtener_kc_automatico.py, para mantener consistencia de
# estilo y reducir dependencias nuevas.
#
# BUGFIX (2026-07-10): mismo fix de zona horaria que obtener_kc_automatico.py
# (ver ese archivo para el detalle). Se convierte con UTC -> America/New_York
# en vez de la hora local del servidor, y se descartan barras de fin de
# semana (artefactos, no sesiones reales).

REQUEST_TIMEOUT = (6, 12)
MAX_RETRIES = 2
CLEAN_WTI_PATH = DATA_DIR / "wti_historico.csv"
EXCHANGE_TZ = ZoneInfo("America/New_York")


def obtener_wti_yahoo(max_retries: int = MAX_RETRIES) -> list[dict]:
    url = "https://query1.finance.yahoo.com/v8/finance/chart/CL=F"
    params = {"interval": "1d", "range": "30d"}
    headers = {"User-Agent": "Mozilla/5.0"}
    last_error = None

    for intento in range(1, max_retries + 1):
        try:
            print(f"Consultando Yahoo Finance CL=F intento {intento}/{max_retries}...", flush=True)
            response = requests.get(url, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            break
        except requests.RequestException as error:
            last_error = error
            print(f"ADVERTENCIA: intento {intento}/{max_retries} fallido al obtener WTI: {error}", flush=True)
            if intento < max_retries:
                time.sleep(3 * intento)
    else:
        raise RuntimeError(f"No fue posible obtener WTI desde Yahoo Finance: {last_error}")

    data = response.json()
    result = data["chart"]["result"][0]
    timestamps = result.get("timestamp", [])
    closes = result.get("indicators", {}).get("quote", [{}])[0].get("close", [])

    registros = []
    descartados_fin_de_semana = 0
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        fecha_dt = datetime.fromtimestamp(ts, tz=timezone.utc).astimezone(EXCHANGE_TZ)
        if fecha_dt.weekday() >= 5:
            descartados_fin_de_semana += 1
            continue
        registros.append({"ds": fecha_dt.strftime("%Y-%m-%d"), "petroleo_wti": round(float(close), 3)})

    if descartados_fin_de_semana:
        print(f"   {descartados_fin_de_semana} barra(s) de fin de semana descartada(s) (artefacto de datos).", flush=True)

    return registros


def cargar_existente() -> pd.DataFrame:
    if CLEAN_WTI_PATH.exists():
        return pd.read_csv(CLEAN_WTI_PATH)
    return pd.DataFrame(columns=["ds", "petroleo_wti"])


def actualizar_wti_automatico() -> bool:
    df_existente = cargar_existente()

    try:
        nuevos = obtener_wti_yahoo(max_retries=1 if not df_existente.empty else MAX_RETRIES)
    except Exception as error:
        if not df_existente.empty:
            print("ADVERTENCIA: Yahoo Finance no respondio, se conserva el ultimo WTI local.")
            print(f"   Motivo: {error}")
            return True
        raise

    if not nuevos:
        print("No se obtuvieron registros nuevos de WTI")
        return not df_existente.empty

    df_nuevo = pd.DataFrame(nuevos)
    df = pd.concat([df_existente, df_nuevo], ignore_index=True)
    df["ds"] = pd.to_datetime(df["ds"], format="mixed", errors="coerce")
    df = df.dropna(subset=["ds"]).sort_values("ds")
    df = df.drop_duplicates(subset=["ds"], keep="last")
    df["ds"] = df["ds"].dt.strftime("%Y-%m-%d")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(CLEAN_WTI_PATH, index=False)

    print(f"OK: WTI actualizado. Registros totales: {len(df)}")
    print(f"   Ultima fecha WTI: {df['ds'].iloc[-1]}")
    print(f"   Ultimo precio WTI: ${float(df['petroleo_wti'].iloc[-1]):.2f}")
    return True


if __name__ == "__main__":
    actualizar_wti_automatico()
