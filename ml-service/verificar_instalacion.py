import os

print('Verificando instalacion de CoffePrice...')
print()

errores = []

libs = ['yfinance', 'bs4', 'requests', 'pandas', 'prophet', 'dotenv']
for lib in libs:
    try:
        __import__(lib)
        print(f'[OK] {lib}')
    except ImportError:
        print(f'[ERROR] {lib} NO INSTALADO')
        errores.append(lib)

print()

archivos = [
    'datos/Precios_cafe.csv',
    'datos/trm_historica.csv',
    'datos/precios_fnc_reales.csv',
    'modelos/modelo_cafe.pkl',
    'scripts/obtener_kc.py',
    'scripts/obtener_trm.py',
    'scripts/obtener_fnc.py',
    'predecir.py',
    'entrenar.py',
    'actualizar_todo.py',
]

for archivo in archivos:
    existe = '[OK]' if os.path.exists(archivo) else '[ERROR]'
    print(f'{existe} {archivo}')
    if not os.path.exists(archivo):
        errores.append(archivo)

print()
if errores:
    print(f'[ERROR] HAY {len(errores)} PROBLEMAS: {errores}')
else:
    print('[OK] TODO CORRECTO - Sistema listo para ejecutar')
