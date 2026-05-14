@echo off
cd /d "%~dp0ml-service-experimental"
python actualizar_todo.py %*
pause
