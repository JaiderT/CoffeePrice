# entrenar.py
# Ejecutar: python entrenar.py
# Requiere: datos/precios_cafe_limpio.csv  (desde 27/11/1991)
#           datos/trm_historica.csv        (desde 27/11/1991)
# Resultado: genera modelos/modelo_cafe.pkl

import pandas as pd
from prophet import Prophet
import pickle
import os
from datetime import datetime

print('=' * 55)
print('  ENTRENAMIENTO DEL MODELO - CoffePrice')
print('=' * 55)
print()

# PASO 1: CARGAR DATOS LIMPIOS (ya recortados desde 1991)
df_precios = pd.read_csv(
    'datos/precios_cafe_limpio.csv',
    parse_dates=['ds']
)
print(f'Precios cargados: {len(df_precios)} registros')
print('Desde: ' + df_precios['ds'].min().strftime('%d/%m/%Y'))
print('Hasta: ' + df_precios['ds'].max().strftime('%d/%m/%Y'))

# PASO 2: CARGAR TRM HISTORICA (desde 27/11/1991 del Banrep)
# IMPORTANTE: ajusta los nombres de columna segun tu archivo
df_trm = pd.read_csv('datos/trm_historica.csv')
print('Columnas del archivo TRM: ' + str(list(df_trm.columns)))

# Renombrar columnas al formato estandar
# Cambia 'fecha' y 'valor' por los nombres reales de tu archivo
df_trm = df_trm.rename(columns={'fecha': 'ds', 'valor': 'trm'})
df_trm['ds'] = pd.to_datetime(df_trm['ds'])
print(f'TRM cargada: {len(df_trm)} registros')

# PASO 3: UNIR PRECIOS CON TRM
# how='left' mantiene TODAS las fechas de precios
# aunque no haya TRM para alguna fecha exacta (fines de semana)
df = pd.merge(df_precios, df_trm[['ds', 'trm']], on='ds', how='left')

# PASO 4: RELLENAR TRM FALTANTE
# Fines de semana y festivos no tienen TRM oficial
# Interpolacion lineal: calcula el valor entre los dos mas cercanos
df['trm'] = df['trm'].interpolate(method='linear')
df['trm'] = df['trm'].ffill().bfill()
print('TRM faltante rellenada por interpolacion lineal')

# PASO 5: CONVERTIR A COP POR CARGA
# precio_usd_lb x libras_por_kg x kg_por_carga x TRM
df['y'] = df['y'] * 2.20462 * 125 * df['trm']
print(f'Precios convertidos a COP por carga')
print('Precio promedio historico: ' + f'{df[chr(121)].mean():,.0f} COP/carga')

# PASO 6: PREPARAR DATOS FINALES PARA PROPHET
df_final = df[['ds', 'y']].dropna()
print(f'Registros para entrenar: {len(df_final)}')

# PASO 7: CONFIGURAR EL MODELO
modelo = Prophet(
    yearly_seasonality      = True,
    weekly_seasonality      = False,
    daily_seasonality       = False,
    changepoint_prior_scale = 0.05,
    interval_width          = 0.80
)

# PASO 8: ENTRENAR
print()
print('Entrenando... (puede tardar 1-3 minutos)')
inicio = datetime.now()
modelo.fit(df_final)
segundos = (datetime.now() - inicio).seconds
print(f'Entrenamiento completado en {segundos} segundos')

# PASO 9: GUARDAR EL MODELO EN DISCO
# El archivo .pkl permite cargar el modelo entrenado sin re-entrenar
os.makedirs('modelos', exist_ok=True)
ruta = 'modelos/modelo_cafe.pkl'
with open(ruta, 'wb') as f:
    pickle.dump(modelo, f)

print()
print(f'OK - Modelo guardado en: {ruta}')
print(f'   Tamano: {os.path.getsize(ruta) / 1024:.1f} KB')
