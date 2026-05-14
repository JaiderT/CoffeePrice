from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
import requests

from pipeline_fnc_hibrido import DATA_DIR

print("=" * 50)
print("OBTENIENDO USD/BRL")
print("=" * 50)


def obtener_serie_usd_brl() -> pd.DataFrame:
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=365)

    url = f"https://api.frankfurter.app/{start_date.isoformat()}..{end_date.isoformat()}"
    params = {"from": "USD", "to": "BRL"}
    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()

    rates = payload.get("rates", {})
    if not rates:
        raise RuntimeError("Frankfurter no devolvio la serie USD/BRL.")

    rows = []
    for ds, values in rates.items():
        brl = values.get("BRL")
        if brl is None:
            continue
        rows.append({"ds": ds, "usd_brl": float(brl)})

    df = pd.DataFrame(rows)
    df["ds"] = pd.to_datetime(df["ds"])
    df = df.sort_values("ds").drop_duplicates(subset=["ds"], keep="last")

    full_range = pd.DataFrame({"ds": pd.date_range(start=start_date, end=end_date, freq="D")})
    df = full_range.merge(df, on="ds", how="left")
    df["usd_brl"] = df["usd_brl"].ffill().bfill()
    return df


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = obtener_serie_usd_brl()
    output_path = DATA_DIR / "usd_brl_historico.csv"
    df.to_csv(output_path, index=False)
    print(f"OK: USD/BRL actualizado con {len(df)} registros")
    print(f"   Rango: {df['ds'].min().date()} a {df['ds'].max().date()}")
    print(f"   Ultimo USD/BRL: {df['usd_brl'].iloc[-1]:.4f}")
