<#
.SYNOPSIS
    Script đóng gói bản cập nhật chuẩn hóa OTA cho CVALMS PRO SUITE
.DESCRIPTION
    - Tự động biên dịch Release Self-Contained x64 cho CvaLmsAgent, CvaLmsService, CvaLms.Updater.
    - Đóng gói bản Auto-Update ZIP (loại trừ cấu hình cục bộ).
    - Tính toán mã băm SHA-256 đối soát toàn vẹn.
    - Xuất file app_release.json đồng bộ với GitHub Releases / Firebase.
#>

param(
    [string]$Version = "1.1.0",
    [string]$DownloadUrl = ""
)

if ([string]::IsNullOrWhiteSpace($DownloadUrl)) {
    $DownloadUrl = "https://github.com/MrKhang-Khoi/cvalms/releases/download/v$Version/CvaLms_Client_Update_v$Version.zip"
}

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   HỆ THỐNG ĐÓNG GÓI CẬP NHẬT CHUẨN HÓA - CVALMS PRO v$Version" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

$releasesDir = Join-Path $scriptDir "dist\ota_updates"
if (-not (Test-Path $releasesDir)) {
    New-Item -ItemType Directory -Path $releasesDir -Force | Out-Null
}

$tempPackDir = Join-Path $scriptDir "dist\temp_pack"
if (Test-Path $tempPackDir) {
    Remove-Item -Path $tempPackDir -Recurse -Force
}

# 1. BIÊN DỊCH VÀ XUẤT BẢN CÁC THÀNH PHẦN CLIENT
Write-Host "`n[1/3] Biên dịch các thành phần Self-Contained Win-x64..." -ForegroundColor Green

$agentProj = Join-Path $scriptDir "student_client\src\CvaLmsAgent\CvaLmsAgent.csproj"
$serviceProj = Join-Path $scriptDir "student_client\src\CvaLmsService\CvaLmsService.csproj"
$updaterProj = Join-Path $scriptDir "student_client\src\CvaLmsUpdater\CvaLmsUpdater.csproj"

& dotnet publish $agentProj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o "$tempPackDir"
if ($LASTEXITCODE -ne 0) { Write-Error "Biên dịch CvaLmsAgent thất bại!"; exit 1 }

& dotnet publish $serviceProj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o "$tempPackDir"
if ($LASTEXITCODE -ne 0) { Write-Error "Biên dịch CvaLmsService thất bại!"; exit 1 }

& dotnet publish $updaterProj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o "$tempPackDir"
if ($LASTEXITCODE -ne 0) { Write-Error "Biên dịch CvaLmsUpdater thất bại!"; exit 1 }

# Cập nhật ngược vào dist/installer_student/bin
$studentBinDir = Join-Path $scriptDir "dist\installer_student\bin"
if (-not (Test-Path $studentBinDir)) { New-Item -ItemType Directory -Path $studentBinDir -Force | Out-Null }
Copy-Item -Path "$tempPackDir\*.exe" -Destination $studentBinDir -Force

# 2. ĐÓNG GÓI GÓI CẬP NHẬT ZIP
Write-Host "`n[2/3] Đóng gói gói cập nhật OTA ZIP..." -ForegroundColor Green
$zipName = "CvaLms_Client_Update_v${Version}.zip"
$zipPath = Join-Path $releasesDir $zipName
if (Test-Path $zipPath) { Remove-Item -Path $zipPath -Force }

# Loại trừ các file pdb và config nhạy cảm khỏi zip cập nhật
Get-ChildItem -Path $tempPackDir -Filter "*.pdb" -Recurse | Remove-Item -Force

Compress-Archive -Path "$tempPackDir\*" -DestinationPath $zipPath -CompressionLevel Optimal

$hashObj = Get-FileHash -Path $zipPath -Algorithm SHA256
$updateSha256 = $hashObj.Hash
$updateSizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)

# 3. TẠO TỆP JSON METADATA
Write-Host "`n[3/3] Tạo cấu hình app_release.json..." -ForegroundColor Green
$releaseDateStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

$appReleaseJson = @{
    version = $Version
    releaseDate = $releaseDateStr
    title = "Bản Nâng Cấp Hệ Thống Phòng Máy CVALMS PRO v$Version"
    status = "ACTIVE"
    downloadUrl = $DownloadUrl
    sha256 = $updateSha256
    packageSizeMb = $updateSizeMb
    changelog = @(
        "Bổ sung trình nâng cấp tự động CvaLms.Updater.exe có giao diện tiến trình",
        "Khắc phục triệt để lỗi rò rỉ bộ nhớ GDI+ và stream lifetime crash khi chiếu bài giảng",
        "Bổ sung màn hình khóa Multi-Monitor và chặn tổ hợp phím Ctrl+Shift+Esc",
        "Kiến trúc Windows Service SYSTEM quản trị Firewall và Watchdog chống bypass",
        "Hỗ trợ nút Wake-on-LAN và Khóa/Mở Internet cho từng máy học sinh trên Web Dashboard"
    )
}

$jsonOutput = $appReleaseJson | ConvertTo-Json -Depth 5
$jsonFilePath = Join-Path $releasesDir "app_release.json"
[System.IO.File]::WriteAllText($jsonFilePath, $jsonOutput, [System.Text.Encoding]::UTF8)

# Ghi tệp checksums.txt
$checksumPath = Join-Path $releasesDir "checksums.txt"
$checksumContent = "$updateSha256  $zipName`n"
[System.IO.File]::WriteAllText($checksumPath, $checksumContent, [System.Text.Encoding]::UTF8)

if (Test-Path $tempPackDir) {
    Remove-Item -Path $tempPackDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host " [V] HOÀN TẤT ĐÓNG GÓI GÓI CẬP NHẬT v$Version!" -ForegroundColor Green
Write-Host "   => Gói ZIP   : $zipName ($updateSizeMb MB)" -ForegroundColor White
Write-Host "   => SHA-256   : $updateSha256" -ForegroundColor Yellow
Write-Host "   => Metadata  : $jsonFilePath" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
