# scripts/obtener_kc.py - Precio café Bolsa NY (yfinance)
import yfinance as yf
import pandas as pd
import os
from datetime import date

def obtener_kc_yfinance():
    try:
        ticket = yf.Ticker('KC=F')
        hist = ticket.history(period='5d')
        if hist.empty:
            print('[WARN] yfinance: no retorno datos para KC=F')
            return None, None
        
        precio_usx = float(hist['Close'].iloc[-1])
        fecha = hist.index[-1].date()
        
        if precio_usx < 10:
            precio_usx = precio_usx * 100
        
        print(f'[OK] yfinance KC=F: {precio_usx:.2f} centavos/lb ({fecha})')
        return round(precio_usx, 2), fecha
    except Exception as e:
        print(f'[ERROR] yfinance: {e}')
        return None, None

def guardar_kc_csv(precio_centavos, fecha):
    archivo = os.path.join(os.path.dirname(__file__), '..', 'datos', 'precio_kc_diario.csv')
    archivo = os.path.normpath(archivo)
    os.makedirs(os.path.dirname(archivo), exist_ok=True)
    
    if precio_centavos is None:
        return False
    
    if os.path.exists(archivo):
        df = pd.read_csv(archivo, parse_dates=['fecha'])
    else:
        df = pd.DataFrame(columns=['fecha', 'precio_centavos_lb'])
    
    fecha_str = str(fecha)
    if fecha_str in df['fecha'].astype(str).values:
        print(f'[INFO] KC para {fecha_str} ya existe')
        return True
    
    nueva = pd.DataFrame({'fecha': [fecha], 'precio_centavos_lb': [precio_centavos]})
    df = pd.concat([df, nueva], ignore_index=True)
    df = df.sort_values('fecha')
    df.to_csv(archivo, index=False)
    print(f'[OK] KC guardado: {fecha_str} -> {precio_centavos:.2f} centavos/lb')
    return True

def obtener_kc_con_fallback():
    precio, fecha = obtener_kc_yfinance()
    if precio and 80 <= precio <= 600:
        return precio, fecha, 'yfinance'
    # Valor de emergencia (abril 2026)
    return 301.0, date.today(), 'emergencia'

if __name__ == '__main__':
    precio, fecha, fuente = obtener_kc_con_fallback()
    if precio:
        guardar_kc_csv(precio, fecha)
        print(f'KC final: {precio:.2f} centavos/lb (fuente: {fuente})')