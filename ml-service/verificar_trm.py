import pandas as pd

df = pd.read_csv('datos/trm_historica.csv', sep=';', decimal=',', quotechar='"')
df.columns = ['ds', 'trm']
df['ds'] = pd.to_datetime(df['ds'])
df = df.sort_values('ds')

print("Últimas 5 filas:")
print(df.tail())
print()
print("TRM promedio histórica:", df['trm'].mean())
print("TRM máxima:", df['trm'].max())
print("TRM mínima:", df['trm'].min())