from __future__ import annotations

import re
from datetime import datetime

import pandas as pd
import requests
from bs4 import BeautifulSoup

from pipeline_fnc_hibrido import FNC_HISTORY_PATH, FNC_INDICATORS_PATH

print("=" * 50)
print("ACTUALIZANDO PRECIO FNC")
print("=" * 50)


def parse_numero_fnc(valor: str, *, entero: bool = False) -> float:
    texto = str(valor).strip()
    texto = re.sub(r"[^\d,.\-]", "", texto)
    if not texto:
        return 0.0

    if "," in texto and "." in texto:
        if texto.rfind(",") > texto.rfind("."):
            texto = texto.replace(".", "").replace(",", ".")
        else:
            texto = texto.replace(",", "")
    elif "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif entero and texto.count(".") >= 1:
        texto = texto.replace(".", "")

    numero = float(texto)
    return float(int(round(numero))) if entero else numero


def extraer_indicadores_fnc() -> dict:
    url = "https://federaciondecafeteros.org/wp/"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    texto = soup.get_text(" ", strip=True)
    patrones_precio = [
        r"Precio interno[^\d$]{0,30}\$?\s*([\d.,]{7,15})",
        r"precio interno[^\d$]{0,30}\$?\s*([\d.,]{7,15})",
        r"Carga de 125 kg[^\d$]{0,30}\$?\s*([\d.,]{7,15})",
    ]

    precio = None
    for patron in patrones_precio:
        match = re.search(patron, texto, flags=re.IGNORECASE)
        if not match:
            continue
        bruto = match.group(1)
        numero = int(parse_numero_fnc(bruto, entero=True))
        if 1_500_000 <= numero <= 4_000_000:
            precio = numero
            break

    if precio is None:
        raise RuntimeError("No se encontro un precio FNC confiable en la pagina.")

    def buscar_float(patrones: list[str], minimo: float, maximo: float, default: float = 0.0) -> float:
        for patron in patrones:
            match = re.search(patron, texto, flags=re.IGNORECASE)
            if not match:
                continue
            bruto = match.group(1)
            numero = parse_numero_fnc(bruto)
            if numero < minimo and "." in bruto and "," not in bruto:
                numero = parse_numero_fnc(bruto, entero=True)
            if minimo <= numero <= maximo:
                return numero
        return default

    bolsa_ny = buscar_float(
        [
            r"Bolsa\s+de\s+NY[^\d$]{0,30}\$?\s*([\d.,]{1,10})",
            r"Bolsa\s+Nueva\s+York[^\d$]{0,30}\$?\s*([\d.,]{1,10})",
            r"Contrato\s+C[^\d$]{0,30}\$?\s*([\d.,]{1,10})",
        ],
        50,
        500,
    )
    trm_fnc = buscar_float(
        [
            r"Tasa\s+de\s+cambio[^\d$]{0,30}\$?\s*([\d.,]{3,12})",
            r"TRM[^\d$]{0,30}\$?\s*([\d.,]{3,12})",
        ],
        2000,
        6000,
    )
    mecic = buscar_float(
        [
            r"MeCIC[^\d$]{0,30}\$?\s*([\d.,]{1,12})",
            r"MECIC[^\d$]{0,30}\$?\s*([\d.,]{1,12})",
        ],
        -500_000,
        500_000,
    )

    return {
        "precio_interno": precio,
        "bolsa_ny": bolsa_ny,
        "trm_fnc": trm_fnc,
        "mecic": mecic,
    }


def extraer_precio_fnc() -> int:
    return int(extraer_indicadores_fnc()["precio_interno"])


def guardar_indicadores_fnc(fecha: str, indicadores: dict) -> None:
    columnas = ["ds", "precio_interno", "bolsa_ny", "trm_fnc", "mecic", "extraido_en"]
    if FNC_INDICATORS_PATH.exists():
        df = pd.read_csv(FNC_INDICATORS_PATH, parse_dates=["ds"])
    else:
        df = pd.DataFrame(columns=columnas)

    fila = {
        "ds": pd.Timestamp(fecha),
        "precio_interno": indicadores["precio_interno"],
        "bolsa_ny": indicadores.get("bolsa_ny", 0.0),
        "trm_fnc": indicadores.get("trm_fnc", 0.0),
        "mecic": indicadores.get("mecic", 0.0),
        "extraido_en": datetime.now().isoformat(timespec="seconds"),
    }

    if df.empty:
        df = pd.DataFrame([fila], columns=columnas)
    else:
        df["ds"] = pd.to_datetime(df["ds"], format="mixed", errors="coerce").dt.normalize()
        fecha_ts = pd.Timestamp(fecha)
        mask = df["ds"] == fecha_ts
        if mask.any():
            for column, value in fila.items():
                df.loc[mask, column] = value
        else:
            df = pd.concat([df, pd.DataFrame([fila])], ignore_index=True)

    df = df[columnas].sort_values("ds").drop_duplicates(subset=["ds"], keep="last")
    df.to_csv(FNC_INDICATORS_PATH, index=False)


def actualizar_historial_fnc() -> bool:
    indicadores = extraer_indicadores_fnc()
    precio = int(indicadores["precio_interno"])
    fecha = datetime.now().strftime("%Y-%m-%d")
    guardar_indicadores_fnc(fecha, indicadores)

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
    print(
        "   Indicadores FNC: "
        f"Bolsa NY {indicadores.get('bolsa_ny', 0):,.2f} | "
        f"TRM {indicadores.get('trm_fnc', 0):,.2f} | "
        f"MeCIC {indicadores.get('mecic', 0):,.0f}"
    )
    return True


if __name__ == "__main__":
    actualizar_historial_fnc()
