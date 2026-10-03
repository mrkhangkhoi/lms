<#
.SYNOPSIS
    Script đóng gói toàn bộ 2 bộ cài đặt Giáo Viên & Học Sinh cho CVALMS PRO SUITE
#>

param(
    [string]$Version = "1.1.0"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   QUY TRÌNH ĐÓNG GÓI 2 BỘ CÀI ĐẶT CÔNG NGHIỆP - CVALMS PRO v$Version" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Gọi build gói cập nhật trước
& powershell -NoProfile -ExecutionPolicy Bypass -File "$scriptDir\build_update_package.ps1" -Version $Version

# 2. Đóng gói bộ cài đặt Giáo Viên
Write-Host "`n[*] Đang nén Bộ Cài Đặt Giáo Viên (Teacher Suite)..." -ForegroundColor Green
$teacherDir = Join-Path $scriptDir "dist\installer_teacher"
$teacherZip = Join-Path $scriptDir "dist\CvaLms_Teacher_Suite_v${Version}.zip"
if (Test-Path $teacherZip) { Remove-Item -Path $teacherZip -Force }

Compress-Archive -Path "$teacherDir\*" -DestinationPath $teacherZip -CompressionLevel Optimal
$teacherHash = (Get-FileHash -Path $teacherZip -Algorithm SHA256).Hash
$teacherSize = [math]::Round((Get-Item $teacherZip).Length / 1MB, 2)

# 3. Đóng gói bộ cài đặt Học Sinh
Write-Host "`n[*] Đang nén Bộ Cài Đặt Học Sinh (Student Client)..." -ForegroundColor Green
$studentDir = Join-Path $scriptDir "dist\installer_student"
$studentZip = Join-Path $scriptDir "dist\CvaLms_Student_Client_Setup_v${Version}.zip"
if (Test-Path $studentZip) { Remove-Item -Path $studentZip -Force }

Compress-Archive -Path "$studentDir\*" -DestinationPath $studentZip -CompressionLevel Optimal
$studentHash = (Get-FileHash -Path $studentZip -Algorithm SHA256).Hash
$studentSize = [math]::Round((Get-Item $studentZip).Length / 1MB, 2)

# 4. Ghi tổng hợp Checksum
$releaseSummary = Join-Path $scriptDir "dist\RELEASE_CHECKSUMS.txt"
$summaryText = "================================================================================`n" +
"CVALMS PRO SUITE - BẢN PHÁT HÀNH CHUẨN CÔNG NGHIỆP v$Version`n" +
"Thời gian: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "`n" +
"================================================================================`n`n" +
"1. BỘ CÀI GIÁO VIÊN (Teacher Suite):`n" +
"   File:    CvaLms_Teacher_Suite_v${Version}.zip ($teacherSize MB)`n" +
"   SHA-256: $teacherHash`n`n" +
"2. BỘ CÀI HỌC SINH (Student Client):`n" +
"   File:    CvaLms_Student_Client_Setup_v${Version}.zip ($studentSize MB)`n" +
"   SHA-256: $studentHash`n`n" +
"3. GÓI CẬP NHẬT TỪ XA (OTA Update):`n" +
"   File:    dist\ota_updates\CvaLms_Client_Update_v${Version}.zip`n" +
"   Metadata: dist\ota_updates\app_release.json`n" +
"================================================================================`n"

[System.IO.File]::WriteAllText($releaseSummary, $summaryText, [System.Text.Encoding]::UTF8)

Write-Host $summaryText -ForegroundColor White
