import json
import os
import pickle
import sys
from datetime import datetime

import pandas as pd
from prophet import Prophet

sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))
from obtener_fnc import obtener_precio_fnc_completo
from obtener_kc import obtener_kc_con_fallback
from obtener_trm import obtener_trm_con_fallback

MODEL_VERSION = 'prophet-v3-kc-trm-calibrado'


def redondear_cop(valor):
    return int(round(float(valor) / 100.0) * 100)


def obtener_ultimo_fnc_real():
    ruta_fnc = 'datos/precios_fnc_reales.csv'
    if not os.path.exists(ruta_fnc):
        return None, None

    df_fnc = pd.read_csv(ruta_fnc)
    if df_fnc.empty or 'precio' not in df_fnc.columns:
        return None, None

    df_fnc['fecha'] = pd.to_datetime(df_fnc['fecha'], format='mixed', errors='coerce')
    df_fnc = df_fnc.dropna(subset=['fecha', 'precio']).sort_values('fecha')
    if df_fnc.empty:
        return None, None

    ultimo = df_fnc.iloc[-1]
    fuente = ultimo['fuente'] if 'fuente' in df_fnc.columns and pd.notna(ultimo['fuente']) else 'csv_real'
    return int(ultimo['precio']), f'{fuente}_csv'


def cargar_historial_kc():
    ruta = 'datos/precios_cafe_limpio.csv'
    df = pd.read_csv(ruta, parse_dates=['ds'])
    df['kc_centavos_lb'] = (pd.to_numeric(df['y'], errors='coerce') * 100).round(2)
    return df[['ds', 'kc_centavos_lb']].dropna().sort_values('ds')


def cargar_historial_trm():
    ruta = 'datos/trm_historica.csv'
    df = pd.read_csv(ruta, sep=';', decimal=',', quotechar='"')
    if list(df.columns) != ['ds', 'trm']:
        df = df.rename(columns={
            'Periodo(MMM DD, AAAA)': 'ds',
            'Tasa Representativa del Mercado (TRM)': 'trm',
        })
    df['ds'] = pd.to_datetime(df['ds'])
    df['trm'] = pd.to_numeric(df['trm'], errors='coerce')
    return df[['ds', 'trm']].dropna().sort_values('ds')


def anexar_ultimo_valor(df, fecha, columna, valor):
    fecha = pd.Timestamp(fecha).normalize()
    if df.empty:
        return pd.DataFrame({'ds': [fecha], columna: [valor]})

    df = df.copy()
    if fecha in set(df['ds'].dt.normalize()):
        df.loc[df['ds'].dt.normalize() == fecha, columna] = valor
    elif fecha > df['ds'].max():
        df = pd.concat([df, pd.DataFrame({'ds': [fecha], columna: [valor]})], ignore_index=True)
    return df.sort_values('ds')


def proyectar_regresor(df, columna, fechas_futuras):
    df_modelo = df[['ds', columna]].rename(columns={columna: 'y'}).dropna().sort_values('ds')

    modelo_regresor = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
    )
    modelo_regresor.fit(df_modelo)

    fecha_max = pd.Timestamp(max(fechas_futuras)).normalize()
    dias_extra = (fecha_max - df_modelo['ds'].max().normalize()).days
    dias_extra = max(0, dias_extra)

    futuro = modelo_regresor.make_future_dataframe(periods=dias_extra, freq='D')
    pronostico = modelo_regresor.predict(futuro)[['ds', 'yhat']]
    pronostico = pronostico.rename(columns={'yhat': columna})

    recientes = df_modelo['y'].tail(90)
    if not recientes.empty:
        media = float(recientes.mean())
        desvio = float(recientes.std()) if len(recientes) > 1 else 0.0
        minimo = max(0.0, media - (2.5 * desvio))
        maximo = media + (2.5 * desvio)
        pronostico[columna] = pronostico[columna].clip(lower=minimo, upper=maximo)

    return pronostico[pronostico['ds'].isin(pd.to_datetime(fechas_futuras))].sort_values('ds')


def limitar_cambios_diarios(serie, cambio_max_pct):
    valores = serie.astype(float).tolist()
    if not valores:
        return serie

    for i in range(1, len(valores)):
        anterior = valores[i - 1]
        maximo = anterior * (1 + cambio_max_pct)
        minimo = anterior * (1 - cambio_max_pct)
        valores[i] = min(max(valores[i], minimo), maximo)

    return pd.Series(valores, index=serie.index)


print('=' * 55)
print('  GENERANDO PREDICCIONES - CoffePrice')
print('=' * 55)
print()

ruta_modelo = 'modelos/modelo_cafe.pkl'
if not os.path.exists(ruta_modelo):
    print('[ERROR] No se encontro el modelo entrenado.')
    print('   Ejecuta primero: python entrenar.py')
    raise SystemExit(1)

print('Cargando modelo entrenado...')
with open(ruta_modelo, 'rb') as archivo_modelo:
    modelo = pickle.load(archivo_modelo)
print('Modelo cargado correctamente')

print('Obteniendo KC y TRM actuales...')
kc_centavos, kc_fecha, kc_fuente = obtener_kc_con_fallback()
trm_hoy, trm_fecha = obtener_trm_con_fallback()
precio_fnc_real, fuente_fnc = obtener_precio_fnc_completo()
precio_fnc_csv, fuente_fnc_csv = obtener_ultimo_fnc_real()

if kc_centavos is None or trm_hoy is None:
    print('[ERROR] No fue posible obtener KC y TRM para generar predicciones.')
    raise SystemExit(1)

if precio_fnc_csv and (not precio_fnc_real or fuente_fnc == 'formula_kc_trm'):
    precio_fnc_real = precio_fnc_csv
    fuente_fnc = fuente_fnc_csv

print(f'  KC actual : {kc_centavos:.2f} centavos/lb ({kc_fuente}, {kc_fecha})')
print(f'  TRM actual: ${trm_hoy:,.2f} ({trm_fecha})')

dias_a_predecir = 30
fecha_inicio = pd.Timestamp.today().normalize()
fechas_futuras = pd.date_range(start=fecha_inicio, periods=dias_a_predecir, freq='D')

hist_kc = cargar_historial_kc()
hist_trm = cargar_historial_trm()
hist_kc = anexar_ultimo_valor(hist_kc, kc_fecha, 'kc_centavos_lb', kc_centavos)
hist_trm = anexar_ultimo_valor(hist_trm, trm_fecha, 'trm', trm_hoy)

pronostico_kc = proyectar_regresor(hist_kc, 'kc_centavos_lb', fechas_futuras)
pronostico_trm = proyectar_regresor(hist_trm, 'trm', fechas_futuras)

futuro = pd.DataFrame({'ds': fechas_futuras})
futuro = futuro.merge(pronostico_kc, on='ds', how='left')
futuro = futuro.merge(pronostico_trm, on='ds', how='left')
futuro['kc_centavos_lb'] = futuro['kc_centavos_lb'].ffill().bfill()
futuro['trm'] = futuro['trm'].ffill().bfill()
futuro.loc[futuro['ds'].dt.normalize() == pd.Timestamp(kc_fecha).normalize(), 'kc_centavos_lb'] = kc_centavos
futuro.loc[futuro['ds'].dt.normalize() == pd.Timestamp(trm_fecha).normalize(), 'trm'] = trm_hoy
futuro['kc_centavos_lb'] = limitar_cambios_diarios(futuro['kc_centavos_lb'], 0.015)
futuro['trm'] = limitar_cambios_diarios(futuro['trm'], 0.005)

print(f'Fechas futuras creadas: {dias_a_predecir} dias desde {fecha_inicio.date()}')
print(
    'Regresores proyectados: '
    f"KC {futuro['kc_centavos_lb'].iloc[0]:.2f}->{futuro['kc_centavos_lb'].iloc[-1]:.2f}, "
    f"TRM {futuro['trm'].iloc[0]:.2f}->{futuro['trm'].iloc[-1]:.2f}"
)

print('Generando predicciones...')
prediccion = modelo.predict(futuro)

precio_modelo_hoy = float(prediccion.iloc[0]['yhat'])
if precio_fnc_real and precio_modelo_hoy > 0:
    factor_calibracion = float(precio_fnc_real) / precio_modelo_hoy
    print(f'Anclando prediccion al precio FNC real: ${precio_fnc_real:,.0f} ({fuente_fnc})')
    print(f'Factor de calibracion aplicado: {factor_calibracion:.4f}')
else:
    factor_calibracion = 1.0
    print('[WARN] No se pudo calibrar con precio FNC real; se usa salida directa del modelo')

resultado = []
generated_at = datetime.now().isoformat()

for i, fila in prediccion.iterrows():
    precio_actual = redondear_cop(fila['yhat'] * factor_calibracion)
    precio_minimo = redondear_cop(fila['yhat_lower'] * factor_calibracion)
    precio_maximo = redondear_cop(fila['yhat_upper'] * factor_calibracion)

    if precio_actual > 0:
        amplitud_pct = ((precio_maximo - precio_minimo) / precio_actual) * 100
        confianza = max(50, min(95, round(100 - amplitud_pct * 2)))
    else:
        confianza = 85

    if i < len(prediccion) - 1 and precio_actual > 0:
        precio_siguiente = redondear_cop(prediccion.iloc[i + 1]['yhat'] * factor_calibracion)
        variacion_pct = ((precio_siguiente - precio_actual) / precio_actual) * 100
        if variacion_pct > 0.3:
            tendencia = 'sube'
        elif variacion_pct < -0.3:
            tendencia = 'baja'
        else:
            tendencia = 'estable'
    else:
        tendencia = 'estable'

    if i == 0 and precio_fnc_real:
        precio_actual = int(precio_fnc_real)
        confianza = 95

    resultado.append({
        'fecha': fila['ds'].strftime('%Y-%m-%d'),
        'precioestimado': precio_actual,
        'preciominimo': precio_minimo,
        'preciomaximo': precio_maximo,
        'tendencia': tendencia,
        'confianza': confianza,
        'modelVersion': MODEL_VERSION,
        'generatedAt': generated_at,
    })

precio_viernes = None
for pred in resultado:
    fecha_pred = datetime.strptime(pred['fecha'], '%Y-%m-%d')
    dia_semana = fecha_pred.weekday()
    if dia_semana == 4:
        precio_viernes = pred['precioestimado']
    elif dia_semana in [5, 6] and precio_viernes is not None:
        pred['precioestimado'] = precio_viernes
        pred['preciominimo'] = precio_viernes
        pred['preciomaximo'] = precio_viernes
        pred['confianza'] = 95
        pred['tendencia'] = 'estable'

print('[OK] Fines de semana ajustados')

ruta_backend = '../backend/datos'
os.makedirs(ruta_backend, exist_ok=True)
ruta_json = os.path.join(ruta_backend, 'predicciones.json')

with open(ruta_json, 'w', encoding='utf-8') as archivo_json:
    json.dump(resultado, archivo_json, indent=2, ensure_ascii=False)

print()
print('=' * 55)
print('PREDICCIONES GENERADAS:')
print(f'  Total dias      : {len(resultado)}')
print(f'  Modelo          : {MODEL_VERSION}')
print(f'  Precio hoy      : ${resultado[0]["precioestimado"]:,.0f}')
print(f'  Rango hoy       : ${resultado[0]["preciominimo"]:,.0f} - ${resultado[0]["preciomaximo"]:,.0f}')
print(f'  KC usado        : {kc_centavos:.2f} centavos/lb')
print(f'  TRM usada       : ${trm_hoy:,.2f}')
print(f'  FNC ancla       : ${precio_fnc_real:,.0f}' if precio_fnc_real else '  FNC ancla       : no disponible')
print()
print(f'[OK] Predicciones guardadas en: {ruta_json}')
