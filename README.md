# 💻 CVALMS PRO SUITE — HỆ THỐNG DẠY HỌC & QUẢN LÝ PHÒNG MÁY TƯƠNG TÁC (18 MÁY)

> **Dành cho Giáo viên Tin học & Quản trị Phòng máy trường THCS/THPT**  
> Bản phát hành chuẩn công nghiệp **v1.1.0** — Tương thích tuyệt đối với Webapp dạy học tương tác.

---

## ❓ VÌ SAO MỞ LINK GITHUB KHÔNG CHẠY TRỰC TIẾP?

Khi bạn truy cập `https://github.com/MrKhang-Khoi/cvalms`, đây là **Kho lưu trữ mã nguồn** (Source Code Repository) của GitHub, chỉ hiển thị cây thư mục mã lệnh (`.cs`, `.js`, `.json`).

Để chạy ứng dụng LMS phòng máy, có 2 cách:

1. **Cách 1: Chạy trong phòng máy thực tế (ĐẦY ĐỦ TÍNH NĂNG NHẤT)**:
   - Tải bản phát hành tại [GitHub Releases v1.1.0](https://github.com/MrKhang-Khoi/cvalms/releases/tag/v1.1.0).
   - Máy Giáo Viên: Chạy **`Chay_May_Giao_Vien.bat`** (Mở Dashboard điều khiển và Web Server tại cổng `5512`).
   - 18 Máy Học Sinh: Chạy **`Cai_Dat_May_Hoc_Sinh.bat`** với quyền Admin.

2. **Cách 2: Xem trước trên Trình duyệt Web (Online Demo / Soạn bài giảng)**:
   - Truy cập qua GitHub Pages: **`https://mrkhang-khoi.github.io/cvalms/`**
   - *(Hoặc bật Settings -> Pages -> Source: Deploy from branch `main` / `root` trong repo)*.

---

## 📦 DANH SÁCH BỘ CÀI ĐẶT CHÍNH THỨC (v1.1.0)

Tải trực tiếp tại: [GitHub Releases v1.1.0](https://github.com/MrKhang-Khoi/cvalms/releases/tag/v1.1.0)

| Gói Cài Đặt | Mục Đích | Cách Sử Dụng |
| :--- | :--- | :--- |
| **`CvaLms_Teacher_Suite_v1.1.0.zip`** | Dành cho Máy Giáo Viên | Giải nén -> Chạy `Chay_May_Giao_Vien.bat` |
| **`CvaLms_Student_Client_Setup_v1.1.0.zip`** | Dành cho 18 Máy Học Sinh | Giải nén -> Chuột phải `Cai_Dat_May_Hoc_Sinh.bat` chọn "Run as administrator" |
| **`CvaLms_Client_Update_v1.1.0.zip`** | Gói nâng cấp từ xa (OTA) | Tự động phân phối qua Gateway không cần cài lại |

---

## 🛡️ CƠ CHẾ BẢO MẬT & CHỐNG HỌC SINH PHÁ

- **Khởi động cùng Windows**: Tự động kích hoạt qua `HKLM Run` + `Windows Task Scheduler` đặc quyền cao nhất khi học sinh mở máy.
- **Dịch vụ SYSTEM Session 0 (`CvaLmsService`)**: Tự động phục hồi sau 3 giây nếu bị tắt, thực thi khóa tường lửa và cấm học sinh phá.
- **Chặn phím tắt & Task Manager**: Vô hiệu hóa Task Manager hệ thống (`DisableTaskMgr = 1`), chặn toàn bộ phím `Alt+F4`, `Ctrl+Shift+Esc`, phím `Windows`, `Alt+Tab`.
- **Khóa bảo vệ tệp (Windows ACL)**: Cấp quyền `Read & Execute (RX)` cho nhóm `Users`, học sinh không có quyền xóa hay sửa file trong `C:\Program Files\CvaLmsClient`.
- **Hỗ trợ Multi-Monitor**: Tự động phủ màn hình khóa toàn diện trên mọi màn hình phụ hoặc máy chiếu.
