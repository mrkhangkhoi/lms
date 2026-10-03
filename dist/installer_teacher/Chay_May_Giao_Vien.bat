@echo off
chcp 65001 >nul
title [CVALMS PRO SUITE] KHỞI ĐỘNG HỆ THỐNG PHÒNG MÁY GIÁO VIÊN
color 0B

echo =====================================================================
echo       HỆ THỐNG QUẢN LÝ VÀ DẠY HỌC TƯƠNG TÁC PHÒNG MÁY - CVALMS PRO
echo                    (Phân hệ Máy Chủ Giáo Viên)
echo =====================================================================
echo.

cd /d "%~dp0app\gateway"

if not exist "node_modules" (
    echo [*] Đang kiểm tra thư viện hệ thống...
    call npm install --silent
)

if not exist "certs\server.crt" (
    echo [*] Đang khởi tạo chứng thư số mTLS bảo mật...
    node generate_certs.js
)

echo [*] Đang khởi chạy Gateway Server trên cổng 49150 (Web) và 49152 (mTLS)...
start /b node server.js

timeout /t 2 /nobreak >nul

echo [*] Đang mở Giao diện Điều khiển Giáo viên trên Trình duyệt...
start http://localhost:49150

echo.
echo =====================================================================
echo [V] Hệ thống đang hoạt động ngầm. Không tắt cửa sổ này khi đang dạy!
echo [V] Địa chỉ truy cập: http://localhost:49150
echo =====================================================================
echo.
pause
