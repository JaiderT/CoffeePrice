# evaluar.py - Evalua la precision de las predicciones
import json
import os

import pandas as pd

def evaluar_prediccion_del_dia():
    """Compara la prediccion de ayer con el precio real de hoy"""
    
    # 1. Cargar precios reales FNC
    ruta_fnc = 'datos/precios_fnc_reales.csv'
    if not os.path.exists(ruta_fnc):
        print('[ERROR] No existe precios_fnc_reales.csv')
        return
    
    df_real = pd.read_csv(ruta_fnc)
    df_real['fecha'] = pd.to_datetime(df_real['fecha'], format='mixed').dt.normalize()
    df_real = df_real.sort_values('fecha')
    
    # 2. Cargar predicciones JSON
    ruta_pred = '../backend/datos/predicciones.json'
    if not os.path.exists(ruta_pred):
        print('[ERROR] No existe predicciones.json')
        return
    
    with open(ruta_pred, 'r', encoding='utf-8') as f:
        predicciones = json.load(f)
    
    df_pred = pd.DataFrame(predicciones)
    df_pred['fecha'] = pd.to_datetime(df_pred['fecha']).dt.normalize()
    
    # 3. Unir predicciones con precios reales
    df_merge = pd.merge(
        df_real[['fecha', 'precio']],
        df_pred[['fecha', 'precioestimado']],
        on='fecha', how='inner'
    )
    
    if len(df_merge) == 0:
        print('[WARN] No hay fechas en comun entre predicciones y precios reales')
        return
    
    # 4. Calcular metricas
    df_merge['error_cop'] = df_merge['precioestimado'] - df_merge['precio']
    df_merge['error_pct'] = (df_merge['error_cop'] / df_merge['precio']) * 100
    df_merge['error_abs_pct'] = df_merge['error_pct'].abs()
    
    mape = df_merge['error_abs_pct'].mean()
    mae = df_merge['error_cop'].abs().mean()
    
    print('=' * 55)
    print('EVALUACION DE PREDICCIONES')
    print(f'Dias evaluados : {len(df_merge)}')
    print(f'MAPE : {mape:.2f}% (error promedio %)')
    print(f'MAE : ${mae:,.0f} COP (error promedio $)')
    print(f'Mejor dia : {df_merge["error_abs_pct"].min():.2f}%')
    print(f'Peor dia : {df_merge["error_abs_pct"].max():.2f}%')
    print()
    print('Ultimos dias:')
    print(df_merge.tail(10)[['fecha', 'precio', 'precioestimado', 'error_pct']].to_string(index=False))
    print('=' * 55)
    
    # 5. Guardar historial
    ruta_hist = 'datos/historial_errores.csv'
    df_merge.to_csv(ruta_hist, index=False)
    print(f'[OK] Historial guardado: {ruta_hist}')

if __name__ == '__main__':
    evaluar_prediccion_del_dia()
