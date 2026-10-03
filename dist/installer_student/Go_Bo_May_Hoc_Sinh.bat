@echo off
chcp 65001 >nul
title [CVALMS PRO SUITE] GỠ BỎ TRẠM HỌC SINH
color 0C

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Vui lòng bấm chuột phải vào file này và chọn "Run as administrator"!
    echo.
    pause
    exit /b 1
)

echo [*] Đang dừng tiến trình và dịch vụ...
taskkill /f /im CvaLmsAgent.exe >nul 2>&1
sc stop CvaLmsService >nul 2>&1
sc delete CvaLmsService >nul 2>&1

echo [*] Xóa mục khởi động và tường lửa...
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "CvaLmsAgent" /f >nul 2>&1
netsh advfirewall firewall delete rule name="CVALMS_STUDENT_ALLOW" >nul 2>&1
netsh advfirewall firewall delete rule name="CVALMS_BLOCK_WAN" >nul 2>&1

echo [*] Xóa thư mục cài đặt...
rmdir /s /q "C:\Program Files\CvaLmsClient" >nul 2>&1

echo.
echo [V] ĐÃ GỠ BỎ HOÀN TOÀN CVALMS KHỎI MÁY NÀY!
echo.
pause
