# actualizar_datos.py
# Se ejecuta automáticamente cada día para obtener nuevos datos

import pandas as pd
import requests
import json
from datetime import datetime, timedelta
import os

print('=' * 60)
print('  ACTUALIZACIÓN AUTOMÁTICA DE DATOS - CoffePrice')
print('=' * 60)
print()

def obtener_trm_hoy():
    """Obtiene la TRM actual del Banco de la República"""
    try:
        # API del Banco de la República
        url = "https://www.datos.gov.co/resource/32sa-8qhi.json"
        response = requests.get(url, timeout=10)
        data = response.json()
        if data:
            trm = float(data[0]['valor'])
            fecha = pd.to_datetime(data[0]['vigenciadesde']).strftime('%Y-%m-%d')
            return fecha, trm
    except Exception as e:
        print(f'⚠️ Error obteniendo TRM: {e}')
    
    # Fallback: estimar basado en día anterior
    return None, None

def obtener_precio_fnc():
    """Obtiene el precio real de la FNC (web scraping o API)"""
    # TODO: Implementar según fuente disponible
    # Por ahora, retorna None para actualización manual
    return None

def actualizar_archivos():
    """Actualiza los CSV con nuevos datos"""
    
    # 1. Actualizar TRM
    fecha_trm, trm = obtener_trm_hoy()
    if trm:
        try:
            df_trm = pd.read_csv('datos/trm_historica.csv', sep=';', decimal=',', quotechar='"')
            # Verificar si ya existe
            if fecha_trm not in df_trm['Periodo(MMM DD, AAAA)'].values:
                nueva_fila = pd.DataFrame({
                    'Periodo(MMM DD, AAAA)': [fecha_trm],
                    'Tasa Representativa del Mercado (TRM)': [trm]
                })
                df_trm = pd.concat([df_trm, nueva_fila], ignore_index=True)
                df_trm.to_csv('datos/trm_historica.csv', sep=';', decimal=',', index=False, quotechar='"')
                print(f'✅ TRM actualizada: {fecha_trm} → ${trm:,.0f}')
        except Exception as e:
            print(f'⚠️ Error actualizando TRM: {e}')
    
    # 2. Actualizar precios reales FNC
    precio_fnc = obtener_precio_fnc()
    if precio_fnc:
        try:
            df_fnc = pd.read_csv('datos/precios_fnc_reales.csv', parse_dates=['fecha'])
            hoy = datetime.now().strftime('%Y-%m-%d')
            if hoy not in df_fnc['fecha'].values:
                nueva_fila = pd.DataFrame({'fecha': [hoy], 'precio': [precio_fnc]})
                df_fnc = pd.concat([df_fnc, nueva_fila], ignore_index=True)
                df_fnc.to_csv('datos/precios_fnc_reales.csv', index=False)
                print(f'✅ Precio FNC actualizado: {hoy} → ${precio_fnc:,.0f}')
        except:
            # Crear archivo si no existe
            df_fnc = pd.DataFrame({'fecha': [datetime.now().strftime('%Y-%m-%d')], 'precio': [precio_fnc]})
            df_fnc.to_csv('datos/precios_fnc_reales.csv', index=False)
            print(f'✅ Archivo de precios FNC creado')
    
    print('\n✅ Actualización completada')

if __name__ == '__main__':
    actualizar_archivos()