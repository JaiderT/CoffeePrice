from __future__ import annotations

import time
from datetime import datetime

import pandas as pd
import requests

from pipeline_fnc_hibrido import CLEAN_TRM_PATH, DATA_DIR, RAW_TRM_FILES, parse_decimal

print("=" * 50)
print("ACTUALIZANDO TRM")
print("=" * 50)

REQUEST_TIMEOUT = (6, 12)
MAX_RETRIES = 2


def obtener_trm_actual(max_retries: int = MAX_RETRIES) -> tuple[float, str]:
    fuentes = [
        (
            "https://api.frankfurter.app/latest",
            {"from": "USD", "to": "COP"},
            lambda payload: (float(payload["rates"]["COP"]), payload.get("date")),
        ),
        (
            "https://open.er-api.com/v6/latest/USD",
            None,
            lambda payload: (float(payload["rates"]["COP"]), datetime.now().strftime("%Y-%m-%d")),
        ),
    ]

    errores = []
    for url, params, parser in fuentes:
        for intento in range(1, max_retries + 1):
            try:
                print(f"Consultando TRM intento {intento}/{max_retries} desde {url}...", flush=True)
                response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                return parser(response.json())
            except Exception as error:
                errores.append(f"{url}: {error}")
                print(f"ADVERTENCIA: intento {intento}/{max_retries} fallido al obtener TRM desde {url}: {error}", flush=True)
                if intento < max_retries:
                    time.sleep(2 * intento)

    raise RuntimeError("No fue posible obtener la TRM desde las APIs configuradas. " + " | ".join(errores[-2:]))


def cargar_existente() -> pd.DataFrame:
    if CLEAN_TRM_PATH.exists():
        df_clean = pd.read_csv(CLEAN_TRM_PATH, sep=";", decimal=",")
        if {"ds", "trm"} <= set(df_clean.columns):
            df = df_clean.rename(columns={"ds": "Fecha (dd/mm/aaaa)", "trm": "TRM"})[
                ["Fecha (dd/mm/aaaa)", "TRM"]
            ].copy()
            df["Fecha (dd/mm/aaaa)"] = pd.to_datetime(
                df["Fecha (dd/mm/aaaa)"], format="mixed", errors="coerce"
            ).dt.strftime("%Y-%m-%d")
            df = df.dropna(subset=["Fecha (dd/mm/aaaa)"])
            df["Fecha sistema"] = ""
            return df[["Fecha sistema", "Fecha (dd/mm/aaaa)", "TRM"]]

    frames = []
    for path in RAW_TRM_FILES:
        if path.exists():
            if path.stat().st_size > 50 * 1024 * 1024:
                continue
            frames.append(pd.read_csv(path))

    if not frames:
        return pd.DataFrame(columns=["Fecha sistema", "Fecha (dd/mm/aaaa)", "TRM"])

    df = pd.concat(frames, ignore_index=True)
    if "Fecha (dd/mm/aaaa)" not in df.columns or "TRM" not in df.columns:
        return pd.DataFrame(columns=["Fecha sistema", "Fecha (dd/mm/aaaa)", "TRM"])

    df["Fecha_norm"] = pd.to_datetime(df["Fecha (dd/mm/aaaa)"], format="mixed", errors="coerce").dt.strftime("%Y-%m-%d")
    df["TRM"] = df["TRM"].apply(parse_decimal)
    df = df.dropna(subset=["Fecha_norm", "TRM"])
    df["Fecha (dd/mm/aaaa)"] = df["Fecha_norm"]
    return df.drop(columns=["Fecha_norm"])


def actualizar_trm_automatica() -> bool:
    df = cargar_existente()

    try:
        trm_actual, fecha = obtener_trm_actual(max_retries=1 if not df.empty else MAX_RETRIES)
    except Exception as error:
        if not df.empty:
            df["Fecha_dt"] = pd.to_datetime(df["Fecha (dd/mm/aaaa)"], format="mixed", errors="coerce")
            df = df.dropna(subset=["Fecha_dt"]).sort_values("Fecha_dt")
            print("ADVERTENCIA: no se pudo obtener TRM nueva, se conserva la ultima TRM local.")
            print(f"   Motivo: {error}")
            print(f"   Ultima fecha TRM local: {df['Fecha (dd/mm/aaaa)'].iloc[-1]}")
            print(f"   Ultimo valor TRM local: ${float(df['TRM'].iloc[-1]):,.2f}")
            return True
        raise

    fecha_sistema = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    nueva = pd.DataFrame(
        {
            "Fecha sistema": [fecha_sistema],
            "Fecha (dd/mm/aaaa)": [fecha],
            "TRM": [round(float(trm_actual), 6)],
        }
    )

    if df.empty:
        df = nueva
        agregados = 1
    else:
        mask = df["Fecha (dd/mm/aaaa)"].astype(str) == fecha
        agregados = 0 if mask.any() else 1
        if mask.any():
            df.loc[mask, "TRM"] = round(float(trm_actual), 6)
            df.loc[mask, "Fecha sistema"] = fecha_sistema
        else:
            df = pd.concat([df, nueva], ignore_index=True)

    df["Fecha_dt"] = pd.to_datetime(df["Fecha (dd/mm/aaaa)"], format="mixed", errors="coerce")
    df = df.dropna(subset=["Fecha_dt"]).sort_values("Fecha_dt")
    df["Fecha (dd/mm/aaaa)"] = df["Fecha_dt"].dt.strftime("%Y-%m-%d")
    df = df.drop(columns=["Fecha_dt"])

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df_clean = df.rename(columns={"Fecha (dd/mm/aaaa)": "ds", "TRM": "trm"})[["ds", "trm"]].copy()
    df_clean["ds"] = pd.to_datetime(df_clean["ds"], format="mixed", errors="coerce").dt.strftime("%Y-%m-%d")
    df_clean = df_clean.dropna(subset=["ds"]).drop_duplicates(subset=["ds"], keep="last")
    df_clean.to_csv(CLEAN_TRM_PATH, index=False, sep=";", decimal=",")

    print(f"OK: TRM actualizada. Nuevos registros: {agregados}")
    print(f"   Fecha TRM: {fecha}")
    print(f"   Valor TRM: ${trm_actual:,.2f}")
    return True


if __name__ == "__main__":
    actualizar_trm_automatica()
