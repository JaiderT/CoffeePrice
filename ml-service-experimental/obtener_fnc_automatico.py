from __future__ import annotations

import re
from datetime import datetime

import pandas as pd
import requests
from bs4 import BeautifulSoup

from pipeline_fnc_hibrido import FNC_HISTORY_PATH

print("=" * 50)
print("ACTUALIZANDO PRECIO FNC")
print("=" * 50)


def extraer_precio_fnc() -> int:
    url = "https://federaciondecafeteros.org/wp/"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    texto = soup.get_text(" ", strip=True)
    patrones = [
        r"Precio interno[^\d$]{0,30}\$?\s*([\d.,]{7,15})",
        r"precio interno[^\d$]{0,30}\$?\s*([\d.,]{7,15})",
        r"Carga de 125 kg[^\d$]{0,30}\$?\s*([\d.,]{7,15})",
    ]

    for patron in patrones:
        match = re.search(patron, texto, flags=re.IGNORECASE)
        if not match:
            continue
        bruto = match.group(1)
        numero = int(re.sub(r"[^\d]", "", bruto))
        if 1_500_000 <= numero <= 4_000_000:
            return numero

    raise RuntimeError("No se encontro un precio FNC confiable en la pagina.")


def actualizar_historial_fnc() -> bool:
    precio = extraer_precio_fnc()
    fecha = datetime.now().strftime("%Y-%m-%d")

    if FNC_HISTORY_PATH.exists():
        df = pd.read_csv(FNC_HISTORY_PATH, parse_dates=["ds"])
    else:
        df = pd.DataFrame(columns=["ds", "y"])

    if df.empty:
        df = pd.DataFrame({"ds": [fecha], "y": [precio]})
        agregados = 1
    else:
        df["ds"] = pd.to_datetime(df["ds"], format="mixed", errors="coerce").dt.normalize()
        df["y"] = pd.to_numeric(df["y"], errors="coerce")
        df = df.dropna(subset=["ds", "y"])

        fecha_ts = pd.Timestamp(fecha)
        mask = df["ds"] == fecha_ts
        agregados = 0 if mask.any() else 1
        if mask.any():
            df.loc[mask, "y"] = precio
        else:
            df = pd.concat([df, pd.DataFrame({"ds": [fecha_ts], "y": [precio]})], ignore_index=True)

    df = df.sort_values("ds").drop_duplicates(subset=["ds"], keep="last")
    df.to_csv(FNC_HISTORY_PATH, index=False)

    print(f"OK: FNC actualizado. Nuevos registros: {agregados}")
    print(f"   Fecha FNC: {fecha}")
    print(f"   Precio FNC: ${precio:,.0f}")
    return True


if __name__ == "__main__":
    actualizar_historial_fnc()
