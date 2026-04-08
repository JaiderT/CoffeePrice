import pandas as pd
import os

print('=' * 50)
print('  LIMPIEZA DE DATOS - CoffePrice')
print('=' * 50)
print()

# PASO 1: CARGAR EL CSV ORIGINAL
# sep=';'       el separador de columnas es punto y coma
# decimal=','   los decimales usan coma
# quotechar='"' las celdas estan entre comillas dobles
df = pd.read_csv('datos/Precios_cafe.csv', sep=';', decimal=',', quotechar='"')
print(f'Filas cargadas del CSV original: {len(df)}')

# PASO 2: RENOMBRAR COLUMNAS
# Prophet necesita exactamente los nombres ds y y
df.columns = ['ds', 'y']

# PASO 3: CONVERTIR FECHAS
# El CSV usa formato americano MM/DD/YYYY
df['ds'] = pd.to_datetime(df['ds'], format='%m/%d/%Y')
print('Fechas convertidas correctamente')

# PASO 4: CORREGIR VALORES MAL ESCALADOS
# Algunos registros recientes vienen 100 veces mas altos
# (por ejemplo 299,6 en lugar de 2,996). Si el valor es
# mayor a 10, lo normalizamos dividiendolo entre 100.
df.loc[df['y'] > 10, 'y'] = df.loc[df['y'] > 10, 'y'] / 100
print('Valores mayores a 10 corregidos dividiendolos entre 100')

# PASO 5: ELIMINAR ANOMALIAS
# Precio historico maximo real del cafe: $4.33 USD/lb (crisis 1977)
# Valores mayores a 10 son errores del CSV. Valores 0 son datos faltantes.
antes = len(df)
df = df[df['y'] > 0]
df = df[df['y'] <= 10]
print(f'Filas con errores eliminadas: {antes - len(df)}')

# PASO 6: RECORTAR DESDE 27 DE NOVIEMBRE DE 1991
# La TRM del Banco de la Republica solo esta disponible desde esta fecha.
# Con datos desde 1991 hasta 2026 tenemos ~34 anos, mas que suficiente.
fecha_inicio = '1991-11-27'
df = df[df['ds'] >= fecha_inicio]
print(f'Datos recortados desde: {fecha_inicio}')

# PASO 7: ORDENAR Y ELIMINAR DUPLICADOS
df = df.sort_values('ds').reset_index(drop=True)
df = df.drop_duplicates(subset='ds', keep='first')

# PASO 8: GUARDAR RESULTADO
os.makedirs('datos', exist_ok=True)
df.to_csv('datos/precios_cafe_limpio.csv', index=False)

print()
print('RESUMEN:')
print(f'  Filas finales limpias : {len(df)}')
print('  Fecha mas antigua     : ' + df['ds'].min().strftime('%d/%m/%Y'))
print('  Fecha mas reciente    : ' + df['ds'].max().strftime('%d/%m/%Y'))
print(f'  Precio minimo         : {round(df[chr(121)].min(),4)} USD/lb')
print(f'  Precio maximo         : {round(df[chr(121)].max(),4)} USD/lb')
print(f'  Precio promedio       : {round(df[chr(121)].mean(),4)} USD/lb')
print()
print('OK - Archivo guardado en: datos/precios_cafe_limpio.csv')
