import pandas as pd

df = pd.read_csv('datos/precios_cafe_limpio.csv', parse_dates=['ds'])
df = df.sort_values('ds')

print("Últimas 5 filas del CSV limpio:")
print(df.tail())
print()
print("Precio promedio USD/lb:", df['y'].mean())
print("Precio máximo USD/lb:", df['y'].max())
print("Precio mínimo USD/lb:", df['y'].min())
print()

# Simular la conversión con TRM actual
trm_hoy = 3700
precio_usd = df['y'].iloc[-1]
precio_cop = precio_usd * 2.20462 * 125 * trm_hoy
print(f"Último precio CSV    : {precio_usd} USD/lb")
print(f"Conversión a COP     : ${precio_cop:,.0f} COP/carga")
print(f"Precio predicho hoy  : $3.832.946 COP/carga")
print(f"Precio real FNC hoy  : $2.180.000 COP/carga")