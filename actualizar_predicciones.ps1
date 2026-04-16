Write-Host "========================================="
Write-Host " ACTUALIZANDO PREDICCIONES - CoffePrice"
Write-Host "========================================="
Write-Host ""

Set-Location "C:\Proyecto\CoffePrice\ml-service"

Write-Host "1. Limpiando datos..."
python limpiar_datos.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "2. Entrenando modelo..."
python entrenar.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "3. Generando predicciones..."
python predecir.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location "C:\Proyecto\CoffePrice\backend"

Write-Host ""
Write-Host "4. Importando predicciones a MongoDB..."
node scripts/importarPredicciones.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "========================================="
Write-Host " PREDICCIONES ACTUALIZADAS CORRECTAMENTE"
Write-Host "========================================="
