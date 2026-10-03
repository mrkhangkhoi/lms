@echo off
chcp 65001 >nul
title [CVALMS PRO SUITE] BỘ CÀI ĐẶT MÁY HỌC SINH TỰ ĐỘNG
color 0A

:: Kiểm tra quyền Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Vui lòng bấm chuột phải vào file này và chọn "Run as administrator"!
    echo.
    pause
    exit /b 1
)

echo =====================================================================
echo       HỆ THỐNG QUẢN LÝ VÀ DẠY HỌC TƯƠNG TÁC PHÒNG MÁY - CVALMS PRO
echo               (Bộ Cài Đặt Trạm Học Sinh Chuẩn Công Nghiệp)
echo =====================================================================
echo.

set /p SEAT_NUM="[?] Nhập số thứ tự máy học sinh này (1 đến 18): "
if %SEAT_NUM% lss 10 (
    set MACHINE_ID=MAY-0%SEAT_NUM%
) else (
    set MACHINE_ID=MAY-%SEAT_NUM%
)

set /p TEACHER_IP="[?] Nhập địa chỉ IP máy Giáo Viên (ví dụ: 192.168.1.100): "

echo.
echo [*] Đang thiết lập cho: %MACHINE_ID% nối tới Giáo Viên: %TEACHER_IP%
set INSTALL_DIR=C:\Program Files\CvaLmsClient

echo [*] Đang dừng các tiến trình cũ nếu có...
taskkill /f /im CvaLmsAgent.exe >nul 2>&1
taskkill /f /im CvaLms.Updater.exe >nul 2>&1
sc stop CvaLmsService >nul 2>&1
timeout /t 1 /nobreak >nul

echo [*] Đang sao chép các tệp chương trình và trình cập nhật vào %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
copy /y "%~dp0bin\CvaLmsAgent.exe" "%INSTALL_DIR%\" >nul
copy /y "%~dp0bin\CvaLmsService.exe" "%INSTALL_DIR%\" >nul
copy /y "%~dp0bin\CvaLms.Updater.exe" "%INSTALL_DIR%\" >nul

:: Lưu cấu hình máy trạm
echo {"machineId": "%MACHINE_ID%", "teacherHost": "%TEACHER_IP%"} > "%INSTALL_DIR%\client_config.json"

echo [*] Đang thiết lập đặc quyền bảo vệ tệp (Chống học sinh xóa/sửa file)...
icacls "%INSTALL_DIR%" /inheritance:r /grant:r "Administrators":(OI)(CI)F /grant:r "SYSTEM":(OI)(CI)F /grant:r "Users":(OI)(CI)RX >nul 2>&1

echo [*] Đang đăng ký Windows Service (Đặc quyền SYSTEM Session 0)...
sc create CvaLmsService binPath= "\"%INSTALL_DIR%\CvaLmsService.exe\"" start= auto DisplayName= "CVA LMS Classroom Management Service" >nul 2>&1
sc description CvaLmsService "Dịch vụ quản trị hệ thống phòng máy CVALMS PRO (Firewall, Watchdog, Task Manager Security)" >nul 2>&1
:: Cấu hình tự động hồi sinh nếu bị tắt
sc failure CvaLmsService reset= 86400 actions= restart/3000/restart/3000/restart/3000 >nul 2>&1
sc start CvaLmsService >nul 2>&1

echo [*] Đang thiết lập Khởi động cùng Windows (Registry Run + Task Scheduler)...
:: Phương thức 1: Registry Run toàn hệ thống
reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "CvaLmsAgent" /t REG_SZ /d "\"%INSTALL_DIR%\CvaLmsAgent.exe\"" /f >nul
:: Phương thức 2: Task Scheduler khi đăng nhập với đặc quyền cao nhất (Chống học sinh tắt trong Startup tab)
schtasks /create /tn "CvaLmsAgent" /tr "\"%INSTALL_DIR%\CvaLmsAgent.exe\"" /sc onlogon /rl highest /f >nul 2>&1

echo [*] Cấu hình ngoại lệ Firewall mạng nội bộ...
netsh advfirewall firewall delete rule name="CVALMS_STUDENT_ALLOW" >nul 2>&1
netsh advfirewall firewall add rule name="CVALMS_STUDENT_ALLOW" dir=out action=allow program="%INSTALL_DIR%\CvaLmsAgent.exe" enable=yes >nul 2>&1

echo [*] Khởi động CvaLmsAgent ngay lập tức...
start "" "%INSTALL_DIR%\CvaLmsAgent.exe"

echo.
echo =====================================================================
echo [V] CÀI ĐẶT THÀNH CÔNG MÁY TRẠM: %MACHINE_ID%!
echo [V] Máy tính đã sẵn sàng kết nối vào hệ thống của Thầy/Cô.
echo =====================================================================
echo.
pause
