import os
import pickle

import pandas as pd
from prophet import Prophet

PRIMA_COLOMBIA = 30.0
LBS_POR_KG = 2.20462
KG_POR_CARGA = 125


def cargar_trm_historica(ruta_trm):
    df_trm = pd.read_csv(ruta_trm, sep=';', decimal=',', quotechar='"')

    if list(df_trm.columns) != ['ds', 'trm']:
        df_trm = df_trm.rename(columns={
            'Periodo(MMM DD, AAAA)': 'ds',
            'Tasa Representativa del Mercado (TRM)': 'trm',
        })

    df_trm = df_trm[['ds', 'trm']].copy()
    df_trm['ds'] = pd.to_datetime(df_trm['ds'])
    df_trm['trm'] = pd.to_numeric(df_trm['trm'], errors='coerce')
    return df_trm.dropna(subset=['ds', 'trm']).sort_values('ds')


print('=' * 55)
print('  ENTRENAMIENTO DEL MODELO - CoffePrice')
print('=' * 55)
print()

print('Cargando datos historicos de cafe...')
ruta_precios = 'datos/precios_cafe_limpio.csv'
if not os.path.exists(ruta_precios):
    print('[ERROR] No se encuentra el archivo de datos limpios.')
    print('   Ejecuta primero: python limpiar_datos.py')
    raise SystemExit(1)

df_precios = pd.read_csv(ruta_precios, parse_dates=['ds'])
print(f'Precios cargados: {len(df_precios)} registros')
print(f'  Desde: {df_precios["ds"].min().date()} hasta: {df_precios["ds"].max().date()}')
print()

print('Cargando TRM historica...')
ruta_trm = 'datos/trm_historica.csv'
if not os.path.exists(ruta_trm):
    print('[ERROR] No existe trm_historica.csv')
    raise SystemExit(1)

df_trm = cargar_trm_historica(ruta_trm)
print(f'TRM cargada: {len(df_trm)} registros')

print('Preparando dataset de entrenamiento...')
df = pd.merge(df_precios, df_trm, on='ds', how='left')
df['trm'] = df['trm'].interpolate(method='linear').ffill().bfill()

# El precio historico limpio representa el contrato C en USD/lb.
# Lo convertimos a centavos para usarlo como regresor explicativo.
df['kc_centavos_lb'] = (df['y'] * 100).round(2)

# El objetivo del modelo queda en COP/carga usando la formula FNC.
df['y'] = (
    ((df['kc_centavos_lb'] + PRIMA_COLOMBIA) / 100.0)
    * LBS_POR_KG
    * KG_POR_CARGA
    * df['trm']
)

df_final = df[['ds', 'y', 'kc_centavos_lb', 'trm']].dropna().sort_values('ds')
if df_final.empty:
    print('[ERROR] No quedaron datos validos para entrenamiento.')
    raise SystemExit(1)

os.makedirs('datos', exist_ok=True)
ruta_debug = 'datos/ultimos_datos_entrenamiento.csv'
df_final.to_csv(ruta_debug, index=False)

print(f'Registros finales para entrenamiento: {len(df_final)}')
print(f'  Rango: {df_final["ds"].min().date()} a {df_final["ds"].max().date()}')
print(f'  Precio promedio: ${df_final["y"].mean():,.0f} COP/carga')
print()

print('Configurando modelo Prophet...')
modelo = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    changepoint_prior_scale=0.10,
    interval_width=0.80,
    seasonality_prior_scale=12.0,
)
modelo.add_regressor('kc_centavos_lb')
modelo.add_regressor('trm')
print('  + Regresor KC agregado')
print('  + Regresor TRM agregado')

print()
print('Entrenando modelo...')
modelo.fit(df_final)
print('[OK] Modelo entrenado correctamente')

os.makedirs('modelos', exist_ok=True)
ruta_modelo = 'modelos/modelo_cafe.pkl'
with open(ruta_modelo, 'wb') as archivo_modelo:
    pickle.dump(modelo, archivo_modelo)

print(f'[OK] Modelo guardado en: {ruta_modelo}')
print(f'[OK] Dataset de apoyo guardado en: {ruta_debug}')

print()
print('=' * 55)
print('RESUMEN DEL ENTRENAMIENTO:')
print(f'  Registros entrenados: {len(df_final)}')
print(f'  Rango de fechas: {df_final["ds"].min().date()} a {df_final["ds"].max().date()}')
print('  Regresores usados: KC y TRM')
print('=' * 55)
