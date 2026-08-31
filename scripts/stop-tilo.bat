@echo off
chcp 65001 >nul
echo 正在停止 Tilo 本地服务 (端口 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Tilo 已成功停止。
timeout /t 2 >nul
