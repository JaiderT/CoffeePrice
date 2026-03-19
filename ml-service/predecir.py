# predecir.py
# Ejecutar: python predecir.py
# Requiere: modelos/modelo_cafe.pkl (generado por entrenar.py)
# Resultado: genera ../backend/datos/predicciones.json

import pickle
import json
import os
from datetime import datetime

print('=' * 55)
print('  GENERANDO PREDICCIONES — CoffePrice')
print('=' * 55)
print()

# ── PASO 1: VERIFICAR QUE EXISTE EL MODELO ──────────
ruta_modelo = 'modelos/modelo_cafe.pkl'
if not os.path.exists(ruta_modelo):
    print('❌ ERROR: No se encontró el modelo entrenado.')
    print('   Ejecuta primero: python entrenar.py')
    exit(1)

# ── PASO 2: CARGAR EL MODELO ENTRENADO ──────────────
print('Cargando modelo entrenado...')
with open(ruta_modelo, 'rb') as f:
    modelo = pickle.load(f)
print('Modelo cargado correctamente')

# ── PASO 3: CREAR FECHAS FUTURAS ─────────────────────
dias_a_predecir = 30
futuro = modelo.make_future_dataframe(periods=dias_a_predecir)
print(f'Fechas futuras creadas: {dias_a_predecir} días adelante')

# ── PASO 4: HACER LA PREDICCIÓN ──────────────────────
print('Generando predicciones...')
prediccion = modelo.predict(futuro)

# ── PASO 5: EXTRAER SOLO LOS DÍAS FUTUROS ────────────
solo_futuro = prediccion[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(dias_a_predecir)

# ── PASO 6: APLICAR FACTOR DE AJUSTE FNC ─────────────
# El precio calculado con bolsa NY + TRM es mayor al precio
# real que paga la FNC porque esta aplica descuentos por
# calidad, humedad, factor de rendimiento y costos logísticos.
# FACTOR_FNC = precio_real_FNC / precio_modelo
# Calculado el 17/03/2026: 2.200.000 / 3.840.209 = 0.573
# Actualizar este valor mensualmente comparando con el precio
# real publicado en: federaciondecafeteros.org
FACTOR_FNC = 0.6550

# ── PASO 7: CONVERTIR A JSON ──────────────────────────
resultado = []
for _, fila in solo_futuro.iterrows():
    resultado.append({
        'fecha':            fila['ds'].strftime('%Y-%m-%d'),
        'precio_estimado':  round(float(fila['yhat'])      * FACTOR_FNC, 0),
        'precio_minimo':    round(float(fila['yhat_lower']) * FACTOR_FNC, 0),
        'precio_maximo':    round(float(fila['yhat_upper']) * FACTOR_FNC, 0),
    })

# ── PASO 8: GUARDAR JSON EN BACKEND ──────────────────
ruta_backend = '../backend/datos'
os.makedirs(ruta_backend, exist_ok=True)
ruta_json = os.path.join(ruta_backend, 'predicciones.json')

with open(ruta_json, 'w', encoding='utf-8') as f:
    json.dump(resultado, f, indent=2, ensure_ascii=False)

# ── RESUMEN ───────────────────────────────────────────
print()
print('PREDICCIONES GENERADAS:')
print(f'  Total de días      : {len(resultado)}')
print(f'  Primer día         : {resultado[0]["fecha"]}')
print(f'  Último día         : {resultado[-1]["fecha"]}')
print(f'  Precio estimado hoy: ${resultado[0]["precio_estimado"]:,.0f} COP/carga')
print(f'  Rango hoy          : ${resultado[0]["precio_minimo"]:,.0f} — ${resultado[0]["precio_maximo"]:,.0f}')
print(f'  Factor ajuste FNC  : {FACTOR_FNC}')
print()
print(f'✅ Predicciones guardadas en: {ruta_json}')
print(f'   Generadas el: {datetime.now().strftime("%d/%m/%Y %H:%M")}')