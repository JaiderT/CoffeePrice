param(
    [string]$FechaPrediccion
)

Write-Host "========================================="
Write-Host " ACTUALIZANDO PREDICCIONES - CoffePrice"
Write-Host "========================================="
Write-Host ""

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $RootDir "ml-service-experimental")

Write-Host "1. Ejecutando pipeline FNC hibrido..."
$PipelineArgs = @("actualizar_todo.py")
if ($FechaPrediccion) {
    $PipelineArgs += @("--fecha-prediccion", $FechaPrediccion)
}

python @PipelineArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location (Join-Path $RootDir "backend")

Write-Host ""
Write-Host "2. Prediccion FNC actualizada en backend/datos/predicciones_fnc.json"

Write-Host ""
Write-Host "========================================="
Write-Host " PREDICCIONES ACTUALIZADAS CORRECTAMENTE"
Write-Host "========================================="
