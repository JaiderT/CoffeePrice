# scripts/obtener_trm.py - TRM oficial Banco de la República
import requests
import pandas as pd
import os
from datetime import date

def obtener_trm_api_principal():
    try:
        url = 'https://www.datos.gov.co/resource/32sa-8qhi.json'
        params = {'$limit': 5, '$order': 'vigenciadesde DESC'}
        response = requests.get(url, params=params, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                trm = float(data[0]['valor'])
                fecha = data[0]['vigenciadesde'][:10]
                print(f'[OK] TRM API: ${trm:,.2f} ({fecha})')
                return trm, fecha
        print(f'[WARN] TRM API status: {response.status_code}')
        return None, None
    except Exception as e:
        print(f'[ERROR] TRM API: {e}')
        return None, None

def obtener_trm_csv_backup():
    try:
        ruta = os.path.join(os.path.dirname(__file__), '..', 'datos', 'trm_historica.csv')
        ruta = os.path.normpath(ruta)
        if not os.path.exists(ruta):
            return 4100.0, str(date.today())
        df = pd.read_csv(ruta, sep=';', decimal=',', quotechar='"')
        df.columns = ['ds', 'trm']
        df['ds'] = pd.to_datetime(df['ds'])
        df = df.sort_values('ds')
        ultimo = df.iloc[-1]
        trm = float(ultimo['trm'])
        fecha = str(ultimo['ds'].date())
        print(f'[OK] TRM desde CSV: ${trm:,.2f} ({fecha})')
        return trm, fecha
    except Exception as e:
        print(f'[ERROR] TRM CSV backup: {e}')
        return 4100.0, str(date.today())

def obtener_trm_con_fallback():
    trm, fecha = obtener_trm_api_principal()
    if trm:
        return trm, fecha
    print('[INFO] Fallback: usando CSV local para TRM')
    return obtener_trm_csv_backup()

def guardar_trm_csv(trm, fecha):
    ruta = os.path.join(os.path.dirname(__file__), '..', 'datos', 'trm_historica.csv')
    ruta = os.path.normpath(ruta)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    try:
        if os.path.exists(ruta):
            df = pd.read_csv(ruta, sep=';', decimal=',', quotechar='"')
            df.columns = ['ds', 'trm']
            df['ds'] = pd.to_datetime(df['ds'])
            if fecha in df['ds'].astype(str).values:
                return
        nueva = pd.DataFrame({'ds': [fecha], 'trm': [trm]})
        df = pd.concat([df, nueva], ignore_index=True) if os.path.exists(ruta) else nueva
        df = df.sort_values('ds')
        df.to_csv(ruta, sep=';', decimal=',', index=False, quotechar='"')
        print(f'[OK] TRM guardada: {fecha} -> ${trm:,.2f}')
    except Exception as e:
        print(f'[ERROR] No se pudo guardar TRM: {e}')

if __name__ == '__main__':
    trm, fecha = obtener_trm_con_fallback()
    print(f'TRM final: ${trm:,.2f} - Fecha: {fecha}')
    guardar_trm_csv(trm, fecha)