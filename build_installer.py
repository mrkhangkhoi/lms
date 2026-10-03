import os
import sys
import shutil
import zipfile
import hashlib
import subprocess
from datetime import datetime

base_dir = r"C:\Users\HPZBook\OneDrive - Sở GD&ĐT Quảng Ngãi\Desktop\CVALMS_PRO_SUITE"
version = "1.1.0"

dist_dir = os.path.join(base_dir, "dist")
ota_dir = os.path.join(dist_dir, "ota_updates")
student_bin = os.path.join(dist_dir, "installer_student", "bin")
teacher_app = os.path.join(dist_dir, "installer_teacher", "app")
temp_pack = os.path.join(dist_dir, "temp_pack")

os.makedirs(ota_dir, exist_ok=True)
os.makedirs(student_bin, exist_ok=True)
if os.path.exists(temp_pack):
    shutil.rmtree(temp_pack)
os.makedirs(temp_pack, exist_ok=True)

print("=" * 70)
print(f"   QUY TRINH DONG GOI CHUAN CONG NGHIEP - CVALMS PRO v{version}")
print("=" * 70)

# 1. Dotnet Publish 3 thành phần
projects = [
    ("CvaLmsAgent", os.path.join(base_dir, "student_client", "src", "CvaLmsAgent", "CvaLmsAgent.csproj")),
    ("CvaLmsService", os.path.join(base_dir, "student_client", "src", "CvaLmsService", "CvaLmsService.csproj")),
    ("CvaLmsUpdater", os.path.join(base_dir, "student_client", "src", "CvaLmsUpdater", "CvaLmsUpdater.csproj")),
]

for name, proj in projects:
    print(f"\n[*] Bien dich {name} (Self-Contained win-x64)...")
    cmd = [
        "dotnet", "publish", proj,
        "-c", "Release",
        "-r", "win-x64",
        "--self-contained", "true",
        "-p:PublishSingleFile=true",
        "-p:IncludeNativeLibrariesForSelfExtract=true",
        "-o", temp_pack
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[!] Loi bien dich {name}:", res.stderr)
        sys.exit(1)
    print(f"[V] Bien dich thanh cong {name}")

# Xóa các file pdb
for root, _, files in os.walk(temp_pack):
    for f in files:
        if f.endswith(".pdb"):
            os.remove(os.path.join(root, f))

# Sao chép sang installer_student/bin
for f in os.listdir(temp_pack):
    src_f = os.path.join(temp_pack, f)
    if os.path.isfile(src_f) and f.endswith(".exe"):
        shutil.copy2(src_f, os.path.join(student_bin, f))

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def zip_dir(src_dir, zip_dest):
    if os.path.exists(zip_dest):
        os.remove(zip_dest)
    with zipfile.ZipFile(zip_dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src_dir):
            for file in files:
                abs_p = os.path.join(root, file)
                rel_p = os.path.relpath(abs_p, src_dir)
                zf.write(abs_p, rel_p)

# 2. Dong goi OTA Update
ota_zip_name = f"CvaLms_Client_Update_v{version}.zip"
ota_zip_path = os.path.join(ota_dir, ota_zip_name)
print(f"\n[*] Dong goi goi OTA Update: {ota_zip_name}...")
zip_dir(temp_pack, ota_zip_path)
ota_hash = sha256_file(ota_zip_path)
ota_size = round(os.path.getsize(ota_zip_path) / (1024 * 1024), 2)

# Tạo app_release.json
import json
release_meta = {
    "version": version,
    "releaseDate": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "title": f"Ban Nang Cap He Thong Phong May CVALMS PRO v{version}",
    "status": "ACTIVE",
    "downloadUrl": f"https://github.com/MrKhang-Khoi/cvalms/releases/download/v{version}/{ota_zip_name}",
    "sha256": ota_hash,
    "packageSizeMb": ota_size,
    "changelog": [
        "Bo sung trinh nang cap tu dong CvaLms.Updater.exe co giao dien tien trinh",
        "Khac phuc triet de loi ro ri bo nho GDI+ va stream lifetime crash khi chieu bai giang",
        "Bo sung man hinh khoa Multi-Monitor va chan to hop phim Ctrl+Shift+Esc",
        "Kien truc Windows Service SYSTEM quan tri Firewall va Watchdog chong bypass",
        "Ho tro nut Wake-on-LAN va Khoa/Mo Internet cho tung may hoc sinh tren Web Dashboard"
    ]
}

json_path = os.path.join(ota_dir, "app_release.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(release_meta, f, indent=2, ensure_ascii=False)

# 3. Dong goi Bo cai Giao Vien
print("\n[*] Dong goi Bo Cai Giao Vien (Teacher Suite)...")
teacher_zip_name = f"CvaLms_Teacher_Suite_v{version}.zip"
teacher_zip_path = os.path.join(dist_dir, teacher_zip_name)
zip_dir(os.path.join(dist_dir, "installer_teacher"), teacher_zip_path)
teacher_hash = sha256_file(teacher_zip_path)
teacher_size = round(os.path.getsize(teacher_zip_path) / (1024 * 1024), 2)

# 4. Dong goi Bo cai Hoc Sinh
print("\n[*] Dong goi Bo Cai Hoc Sinh (Student Client)...")
student_zip_name = f"CvaLms_Student_Client_Setup_v{version}.zip"
student_zip_path = os.path.join(dist_dir, student_zip_name)
zip_dir(os.path.join(dist_dir, "installer_student"), student_zip_path)
student_hash = sha256_file(student_zip_path)
student_size = round(os.path.getsize(student_zip_path) / (1024 * 1024), 2)

# Dọn dẹp thư mục tạm
shutil.rmtree(temp_pack, ignore_errors=True)

# 5. Xuất báo cáo Checksum
summary = f"""================================================================================
CVALMS PRO SUITE - BAN PHAT HANH CHUAN CONG NGHIEP v{version}
Thoi gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================================

1. BO CAI GIAO VIEN (Teacher Suite):
   File:    {teacher_zip_name} ({teacher_size} MB)
   SHA-256: {teacher_hash}

2. BO CAI HOC SINH (Student Client):
   File:    {student_zip_name} ({student_size} MB)
   SHA-256: {student_hash}

3. GOI CAP NHAT TU XA (OTA Update):
   File:    {ota_zip_name} ({ota_size} MB)
   SHA-256: {ota_hash}
   Metadata: app_release.json
================================================================================
"""

checksum_file = os.path.join(dist_dir, "RELEASE_CHECKSUMS.txt")
with open(checksum_file, "w", encoding="utf-8") as f:
    f.write(summary)

print("\n" + summary)
