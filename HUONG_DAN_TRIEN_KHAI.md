# 📘 HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG CVALMS PRO SUITE
**Hệ thống Quản lý và Dạy học Tương tác Phòng máy Chuẩn Công Nghiệp**
*Dành cho Phòng Tin học 18 Máy trạm & 01 Máy Chủ Giáo viên*

---

## 🏛️ 1. KIẾN TRÚC HỆ THỐNG (DUAL-PROCESS ARCHITECTURE)

Hệ thống được thiết kế theo mô hình chuẩn của các phần mềm quản lý phòng máy tiên tiến (Veyon, NetSupport School):

1. **Bộ Cài Máy Chủ Giáo Viên (`teacher_suite`)**:
   - **Giao diện Web Micro-LMS (`index.html`)**: Chạy trực tiếp trên trình duyệt hiện đại (Chrome/Edge), tích hợp tiến trình bài dạy chuẩn Công văn 5512, đấu trường đố vui trực tiếp, bốc thăm may mắn, bảng vàng thành tích và bảng điều khiển giám sát 18 máy trạm.
   - **Gateway Server (`gateway/server.js`)**: Cổng điều phối thời gian thực qua giao thức HTTP/WebSocket (`49150`) và mã hóa mTLS Mutual Authentication TCP (`49152`).

2. **Bộ Cài Máy Trạm Học Sinh (`student_client`)**:
   - **`CvaLmsAgent.exe` (User Session)**: Ứng dụng chạy ngầm trong phiên làm việc của học sinh, đảm nhiệm chụp màn hình gửi về giáo viên, nhận luồng bài giảng (Screen Broadcast) và khóa tập trung (Focus Lock). Đã khắc phục triệt để lỗi rò rỉ bộ nhớ GDI+ và bổ sung hỗ trợ đa màn hình (Multi-Monitor).
   - **`CvaLmsService.exe` (Session 0 - Đặc quyền SYSTEM)**: Dịch vụ Windows Service chạy ngầm độc lập với quyền cao nhất. Đảm nhiệm cấu hình Windows Firewall (chặn Internet/WAN mà học sinh thường không thể bypass), chống tắt lén Task Manager và cơ chế Watchdog tự phục hồi tiến trình Agent.

---

## 🚀 2. QUY TRÌNH CÀI ĐẶT 1-CLICK TỰ ĐỘNG

### Bước 1: Thiết lập Máy Giáo Viên (Server)
1. Mở thư mục `dist/installer_teacher`.
2. Bấm đúp vào tệp **`Chay_May_Giao_Vien.bat`**.
3. Hệ thống sẽ tự động khởi động Gateway và mở giao diện Quản lý - Dạy học trên trình duyệt (`http://localhost:49150`).
4. Xem địa chỉ IP của máy giáo viên (bằng lệnh `ipconfig` trong Command Prompt, ví dụ: `192.168.1.100`) để khai báo cho các máy học sinh.

### Bước 2: Thiết lập Máy Học Sinh (18 Máy Trạm)
1. Copy thư mục `dist/installer_student` vào USB hoặc chia sẻ qua mạng nội bộ.
2. Trên từng máy học sinh:
   - Bấm chuột phải vào **`Cai_Dat_May_Hoc_Sinh.bat`** -> chọn **`Run as administrator`**.
   - Nhập số thứ tự máy (Ví dụ nhập `1` cho máy số 1 -> hệ thống tự định danh là `MAY-01`).
   - Nhập địa chỉ IP máy Giáo viên đã xem ở Bước 1 (Ví dụ: `192.168.1.100`).
3. Bộ cài sẽ tự động:
   - Copy tệp binary Self-Contained độc lập vào `C:\Program Files\CvaLmsClient`.
   - Đăng ký và khởi chạy dịch vụ Windows Service `CvaLmsService`.
   - Đăng ký tự khởi động cùng Windows cho `CvaLmsAgent`.
   - Kết nối mTLS bảo mật tức thì tới máy Giáo viên.

---

## 🎮 3. CÁC TÍNH NĂNG ĐIỀU KHIỂN & DẠY HỌC TƯƠNG TÁC

| Thao tác | Mô tả chi tiết |
| :--- | :--- |
| **Bật nguồn Wake-on-LAN (WOL)** | Bật toàn bộ 18 máy hoặc bấm nút tia sét `⚡` trên từng thẻ máy đang OFFLINE để kích nguồn qua mạng. |
| **Khóa / Mở Internet** | Bấm nút quả địa cầu `🌐` trên thanh công cụ (áp dụng cả lớp) hoặc trên từng máy để cô lập kết nối ra Internet mà vẫn giữ bài học nội bộ. |
| **Khóa màn hình (Focus Lock)** | Khóa chuột, bàn phím, vô hiệu hóa `Alt+Tab`, `Ctrl+Shift+Esc`, hiển thị thông điệp yêu cầu học sinh lắng nghe. Mở khóa bằng mật mã khẩn cấp `123456` hoặc lệnh từ xa của GV. |
| **Chiếu bài giảng (Broadcast)** | Truyền màn hình máy giáo viên độ trễ cực thấp đến toàn bộ 18 máy học sinh cùng lúc. |
| **Thu bài tập tự động** | Gom tự động các tệp bài làm của học sinh, nén ZIP có kèm mã băm SHA-256 về máy giáo viên. |
| **Tắt / Khởi động lại máy** | Tắt hoặc Reboot an toàn toàn bộ phòng máy hoặc từng máy sau giờ học. |
