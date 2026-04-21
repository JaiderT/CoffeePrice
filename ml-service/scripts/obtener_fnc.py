# scripts/obtener_fnc.py - Scraping precio FNC
import requests
from bs4 import BeautifulSoup
import re
import pandas as pd
import os
from datetime import date

def es_dia_habil():
    return date.today().weekday() < 5

def obtener_precio_fnc_metodo1():
    try:
        url = 'https://federaciondecafeteros.org/wp/'
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        resp = requests.get(url, headers=headers, timeout=20)
        if resp.status_code != 200:
            return None
        
        soup = BeautifulSoup(resp.text, 'lxml')
        texto_completo = soup.get_text(' ', strip=True)
        
        patrones = [
            r'Precio interno[^\$\\d]*\$([\\d,\\.]+)',
            r'precio interno[^\$\\d]*\$([\\d,\\.]+)',
            r'\$([2-9][\\d]{2,3}[,\\.][\\d]{3}[,\\.][\\d]{3})'
        ]
        
        for patron in patrones:
            match = re.search(patron, texto_completo, re.IGNORECASE)
            if match:
                precio_str = match.group(1)
                precio_limpio = precio_str.replace(',', '').replace('.', '').strip()
                try:
                    precio = int(precio_limpio)
                    if 500000 <= precio <= 5000000:
                        print(f'[OK] FNC scraping: ${precio:,}')
                        return precio
                except:
                    pass
        return None
    except Exception as e:
        print(f'[ERROR] FNC scraping: {e}')
        return None

def obtener_precio_fnc_metodo2():
    """Calcular precio FNC usando formula oficial (cuando scraping falla)"""
    try:
        import sys
        sys.path.append(os.path.dirname(__file__))
        from obtener_kc import obtener_kc_con_fallback
        from obtener_trm import obtener_trm_con_fallback
        
        kc_centavos, _, _ = obtener_kc_con_fallback()
        trm, _ = obtener_trm_con_fallback()
        
        if kc_centavos and trm:
            PRIMA = 30.0
            LBS_KG = 2.20462
            KG_CARGA = 125
            
            precio_usd_lb = (kc_centavos + PRIMA) / 100.0
            precio_cop = precio_usd_lb * LBS_KG * KG_CARGA * trm
            precio_redondeado = round(precio_cop / 1000) * 1000
            print(f'[OK] FNC calculado: ${precio_redondeado:,}')
            return precio_redondeado
        return None
    except Exception as e:
        print(f'[ERROR] Calculo FNC: {e}')
        return None

def obtener_precio_fnc_csv_backup():
    try:
        ruta = os.path.join(os.path.dirname(__file__), '..', 'datos', 'precios_fnc_reales.csv')
        ruta = os.path.normpath(ruta)
        if not os.path.exists(ruta):
            return None
        df = pd.read_csv(ruta, parse_dates=['fecha'])
        if len(df) > 0:
            ultimo = df.sort_values('fecha').iloc[-1]
            return int(ultimo['precio'])
        return None
    except Exception as e:
        print(f'[ERROR] FNC CSV backup: {e}')
        return None

def obtener_precio_fnc_completo():
    if es_dia_habil():
        print('[INFO] Intentando obtener precio FNC por scraping...')
        precio = obtener_precio_fnc_metodo1()
        if precio:
            return precio, 'scraping_web'
        
        print('[INFO] Scraping fallo. Intentando calculo por formula...')
        precio = obtener_precio_fnc_metodo2()
        if precio:
            return precio, 'formula_kc_trm'
    
    print('[INFO] Usando precio del CSV backup...')
    precio = obtener_precio_fnc_csv_backup()
    if precio:
        return precio, 'csv_backup'
    
    return None, 'sin_datos'

def guardar_precio_fnc(precio, fuente):
    if not precio:
        return

    if fuente == 'formula_kc_trm':
        print('[INFO] No se guarda formula_kc_trm en precios_fnc_reales.csv para no contaminar el historico real')
        return
    
    ruta = os.path.join(os.path.dirname(__file__), '..', 'datos', 'precios_fnc_reales.csv')
    ruta = os.path.normpath(ruta)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    
    hoy = str(date.today())
    
    if os.path.exists(ruta):
        df = pd.read_csv(ruta, parse_dates=['fecha'])
        if hoy in df['fecha'].astype(str).values:
            print(f'[INFO] Precio FNC para {hoy} ya existe')
            return
    else:
        df = pd.DataFrame(columns=['fecha', 'precio', 'fuente'])
    
    nueva = pd.DataFrame({'fecha': [hoy], 'precio': [precio], 'fuente': [fuente]})
    df = pd.concat([df, nueva], ignore_index=True)
    df.to_csv(ruta, index=False)
    print(f'[OK] Precio FNC guardado: {hoy} -> ${precio:,}')

if __name__ == '__main__':
    precio, fuente = obtener_precio_fnc_completo()
    if precio:
        guardar_precio_fnc(precio, fuente)
        print(f'Precio FNC final: ${precio:,} (fuente: {fuente})')
