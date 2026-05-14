from __future__ import annotations

import time
from datetime import datetime

import pandas as pd
import requests

from pipeline_fnc_hibrido import CLEAN_KC_PATH, DATA_DIR, RAW_KC_FILES

print("=" * 50)
print("ACTUALIZANDO KC DESDE YAHOO FINANCE")
print("=" * 50)

REQUEST_TIMEOUT = (6, 12)
MAX_RETRIES = 2


def obtener_kc_yahoo(max_retries: int = MAX_RETRIES) -> list[dict]:
    url = "https://query1.finance.yahoo.com/v8/finance/chart/KC=F"
    params = {"interval": "1d", "range": "10d"}
    headers = {"User-Agent": "Mozilla/5.0"}
    last_error = None

    for intento in range(1, max_retries + 1):
        try:
            print(f"Consultando Yahoo Finance KC=F intento {intento}/{max_retries}...", flush=True)
            response = requests.get(url, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            break
        except requests.RequestException as error:
            last_error = error
            print(f"ADVERTENCIA: intento {intento}/{max_retries} fallido al obtener KC: {error}", flush=True)
            if intento < max_retries:
                time.sleep(3 * intento)
    else:
        raise RuntimeError(f"No fue posible obtener KC desde Yahoo Finance: {last_error}")

    data = response.json()

    result = data["chart"]["result"][0]
    timestamps = result.get("timestamp", [])
    closes = result.get("indicators", {}).get("quote", [{}])[0].get("close", [])

    registros = []
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        fecha = datetime.fromtimestamp(ts).strftime("%m/%d/%Y")
        registros.append(
            {
                "Date": fecha,
                "Price": round(float(close), 2),
                "Open": "",
                "High": "",
                "Low": "",
                "Vol.": "",
                "Change %": "",
            }
        )
    return registros


def cargar_existente() -> pd.DataFrame:
    if CLEAN_KC_PATH.exists():
        df_clean = pd.read_csv(CLEAN_KC_PATH)
        if {"ds", "y"} <= set(df_clean.columns):
            df = df_clean.rename(columns={"ds": "Date", "y": "Price"})[["Date", "Price"]].copy()
            df["Date"] = pd.to_datetime(df["Date"], format="mixed", errors="coerce").dt.strftime("%m/%d/%Y")
            df = df.dropna(subset=["Date"])
            for column in ["Open", "High", "Low", "Vol.", "Change %"]:
                df[column] = ""
            return df[["Date", "Price", "Open", "High", "Low", "Vol.", "Change %"]]

    frames = []
    for path in RAW_KC_FILES:
        if path.exists():
            if path.stat().st_size > 50 * 1024 * 1024:
                continue
            frames.append(pd.read_csv(path))
    if not frames:
        return pd.DataFrame(columns=["Date", "Price", "Open", "High", "Low", "Vol.", "Change %"])
    df = pd.concat(frames, ignore_index=True)
    if "Date" not in df.columns or "Price" not in df.columns:
        return pd.DataFrame(columns=["Date", "Price", "Open", "High", "Low", "Vol.", "Change %"])
    df["Date_norm"] = pd.to_datetime(df["Date"], format="mixed", errors="coerce").dt.strftime("%m/%d/%Y")
    df = df.dropna(subset=["Date_norm"])
    df["Date"] = df["Date_norm"]
    df = df.drop(columns=["Date_norm"])
    return df


def actualizar_historial_kc() -> bool:
    df_existente = cargar_existente()

    try:
        nuevos = obtener_kc_yahoo(max_retries=1 if not df_existente.empty else MAX_RETRIES)
    except Exception as error:
        if not df_existente.empty:
            df_existente["Date_dt"] = pd.to_datetime(df_existente["Date"], format="mixed", errors="coerce")
            df_existente = df_existente.dropna(subset=["Date_dt"]).sort_values("Date_dt")
            print("ADVERTENCIA: Yahoo Finance no respondio, se conserva el ultimo KC local.")
            print(f"   Motivo: {error}")
            print(f"   Ultima fecha KC local: {df_existente['Date'].iloc[-1]}")
            print(f"   Ultimo precio KC local: {float(df_existente['Price'].iloc[-1]):.2f}")
            return True
        raise

    if not nuevos:
        print("No se obtuvieron registros nuevos de KC")
        return not df_existente.empty

    fechas_existentes = set(df_existente["Date"].astype(str))

    agregados = 0
    for registro in nuevos:
        if registro["Date"] not in fechas_existentes:
            df_existente = pd.concat([df_existente, pd.DataFrame([registro])], ignore_index=True)
            fechas_existentes.add(registro["Date"])
            agregados += 1
        else:
            mask = df_existente["Date"].astype(str) == registro["Date"]
            df_existente.loc[mask, "Price"] = registro["Price"]

    df_existente["Date_dt"] = pd.to_datetime(df_existente["Date"], format="mixed", errors="coerce")
    df_existente = df_existente.dropna(subset=["Date_dt"]).sort_values("Date_dt")
    df_existente["Date"] = df_existente["Date_dt"].dt.strftime("%m/%d/%Y")
    df_existente = df_existente.drop(columns=["Date_dt"])

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df_clean = df_existente.rename(columns={"Date": "ds", "Price": "y"})[["ds", "y"]].copy()
    df_clean["ds"] = pd.to_datetime(df_clean["ds"], format="mixed", errors="coerce").dt.strftime("%Y-%m-%d")
    df_clean = df_clean.dropna(subset=["ds"]).drop_duplicates(subset=["ds"], keep="last")
    df_clean.to_csv(CLEAN_KC_PATH, index=False)

    print(f"OK: KC actualizado. Nuevos registros: {agregados}")
    print(f"   Ultima fecha KC: {df_existente['Date'].iloc[-1]}")
    print(f"   Ultimo precio KC: {float(df_existente['Price'].iloc[-1]):.2f}")
    return True


if __name__ == "__main__":
    actualizar_historial_kc()
