# Kế Hoạch Triển Khai Module Tự Học Cá Nhân Hóa (CVALMS Self-Study Pro)

> **Dành cho Agent thực thi:** BẮT BUỘC sử dụng sub-skill: `superpowers:executing-plans` (Native) hoặc `superpowers:subagent-driven-development`. Mỗi bước sử dụng cú pháp checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Xây dựng module tự học trực tuyến độc lập `self_study.html` tích hợp sâu vào hệ thống CVALMS (18 máy trạm + máy chủ giáo viên): hỗ trợ soạn bài linh hoạt bằng giao diện trực quan/Markdown/Excel (không hardcode), cơ chế khóa/mở tiến độ 2 chiều (học sinh tuần tự + giáo viên can thiệp từ xa), đa phương tiện (ảnh/video), 5 loại câu hỏi kiểm tra đánh giá, giám sát thời gian thực qua LAN và đồng bộ từ xa qua GitHub.

**Kiến trúc:** 
1. **Dữ liệu thuần túy (Data-Driven)**: Tách rời 100% nội dung bài học ra tệp JSON (`lessons/<id>.json`), quản lý bởi `manifest.json`.
2. **Động cơ học tập (Player Engine - `self_study_engine.js`)**: Máy trạng thái 4 bước tuần tự (*Gated Progression*), tự chấm điểm, âm thanh Web Audio, bắt lệnh điều khiển từ xa của Giáo viên (Focus Lock, Step Control).
3. **Trình soạn thảo trực quan (Authoring Studio - `self_study_editor.js`)**: WYSIWYG form, soạn Markdown, nhúng video/ảnh, tạo ngân hàng câu hỏi, xuất/nhập JSON/Excel, đồng bộ GitHub/LAN.
4. **Phía Server (`gateway/server.js`)**: Cung cấp REST/WebSocket API nhận bài mới, lưu trữ, tiếp nhận tiến độ 18 máy và phân phối lệnh khóa/mở.
5. **Giao diện Giám sát (`index.html` Tab Monitor)**: Bổ sung ma trận 18 máy theo dõi tiến độ tự học thời gian thực và bộ công cụ điều khiển từ xa.

**Ngăn xếp công nghệ:** Vanilla HTML5, CSS3 hiện đại, Vanilla JavaScript (ES6+), Node.js (Gateway Server), Web Audio API, Micro-Markdown parser. Hoàn toàn không phụ thuộc thư viện nặng ngoài mạng, 100% chạy mượt Offline LAN.

---

## Ràng Buộc Hệ Thống (Global Constraints)
1. **Tuyệt đối không hardcode nội dung bài học**: Toàn bộ bài giảng nạp từ JSON hoặc nhập qua Editor.
2. **Độc lập và bảo toàn mã nguồn cũ**: Module `self_study.html` chạy độc lập, không làm gãy các tính năng điều khiển phòng máy hiện tại trong `index.html`.
3. **Hoạt động Offline 100% trong mạng LAN**: Toàn bộ icon, CSS, âm thanh đều chạy nội bộ, không phụ thuộc kết nối Internet WAN của trường.
4. **Bảo mật và chống học sinh phá**: Mã nguồn máy trạm chỉ đọc dữ liệu bài học, học sinh không thể tự sửa điểm hoặc gửi gian lận trạng thái mà không vượt qua bước kiểm tra.
5. **Chuẩn thẩm mỹ hiện đại**: Tuân thủ chuẩn thiết kế EdTech (Khan Academy / Coursera), font chữ lớn rõ ràng, độ tương phản chuẩn WCAG AAA cho học sinh THCS.

---

## Trọng Tâm Kiểm Thử & Trường Hợp Biên (Review Focus)
1. **Mất kết nối mạng LAN đột ngột**: Học sinh đang học nếu mạng LAN mất kết nối, hệ thống phải lưu tạm vào `localStorage` và tự động gửi bù khi mạng có lại (không mất bài làm).
2. **Học sinh cố tình gian lận vượt bước**: Bẻ khóa giao diện bằng Inspect Element F12 không vượt qua được logic kiểm tra đáp án và xác thực của Engine.
3. **Giáo viên kích hoạt "Khóa Tập Trung (Focus Lock)"**: Toàn bộ 18 máy lập tức hiện màn hình khóa "Giáo viên yêu cầu chú ý lên bảng", tạm dừng toàn bộ video và tương tác.
4. **Tệp JSON/Excel bài học bị lỗi cú pháp**: Engine phải có bộ thẩm định (*Schema Validator*) thông báo lỗi rõ ràng ở dòng/mục nào, không được làm sập giao diện học sinh.
5. **Đồng bộ từ xa qua GitHub**: Khi giáo viên soạn bài ở nhà và đẩy lên GitHub, máy chủ phòng máy tại trường chỉ cần 1-click là tải và đồng bộ các bài mới vào thư mục `lessons/`.

---

## Chi Tiết Các Nhiệm Vụ Triển Khai (Tasks)

### Nhiệm Vụ 1: Thiết Kế Chuẩn Dữ Liệu `Lesson JSON Schema` & Tệp Mẫu
**Tệp:**
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/lessons/manifest.json`
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/lessons/tin6_bai12.json`
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/lessons/tin7_bai3.json`
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/tests/test_lesson_schema.js`

**Giao diện & Cấu trúc:**
- `manifest.json`: Danh mục phân cấp các bài học theo Khối (6, 7, 8, 9), Chủ đề SGK, Tiêu đề bài và đường dẫn file.
- `tinX_baiY.json`: Cấu trúc đầy đủ 4 bước (Mục tiêu, Lý thuyết + Media, Ghi nhớ, Luyện tập đa dạng 5 loại câu hỏi).

- [x] **Bước 1: Viết test kiểm tra tính hợp lệ của Schema bài học**
- [x] **Bước 2: Chạy test để xác nhận FAIL (chưa có tệp dữ liệu)**
- [x] **Bước 3: Tạo thư mục `lessons/` và tạo các tệp `manifest.json`, `tin6_bai12.json`, `tin7_bai3.json`**
- [x] **Bước 4: Chạy lại test xác nhận PASS 100%**
- [x] **Bước 5: Commit Git dữ liệu mẫu**

---

### Nhiệm Vụ 2: Bổ Sung Endpoint Quản Trị Tự Học Trong Gateway Server
**Tệp:**
- Chỉnh sửa: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/teacher_suite/gateway/server.js`
- Test: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/tests/test_gateway_self_study_api.js`

**Giao diện & Chức năng Endpoint:**
- `GET /api/self-study/manifest`: Trả về danh sách cây bài học từ `manifest.json`.
- `GET /api/self-study/lesson/:id`: Trả về chi tiết bài học dạng JSON.
- `POST /api/self-study/lesson`: Nhận bài soạn mới từ Giáo viên (lưu vào đĩa máy chủ).
- `POST /api/self-study/progress`: Nhận báo cáo tiến độ học sinh (`deskId`, `studentName`, `lessonId`, `step`, `score`).
- `GET /api/self-study/live-progress`: Trả về ma trận tiến độ hiện thời của 18 máy.
- `POST /api/self-study/teacher-control`: Giáo viên phát lệnh khóa/mở bước hoặc khóa tập trung.

- [x] **Bước 1: Viết bài test kiểm thử các endpoint HTTP của Gateway**
- [x] **Bước 2: Chạy test xác nhận FAIL**
- [x] **Bước 3: Cập nhật `teacher_suite/gateway/server.js` bổ sung các route trên**
- [x] **Bước 4: Chạy test xác nhận PASS toàn bộ các API**
- [x] **Bước 5: Commit Git**

---

### Nhiệm Vụ 3: Xây Dựng Động Cơ Tự Học (`js/self_study_engine.js`)
**Tệp:**
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/js/self_study_engine.js`
- Đồng bộ: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/teacher_suite/js/self_study_engine.js`

**Tính năng cốt lõi:**
- Bộ máy trạng thái tuần tự: `Step 1 -> Step 2 -> Step 3 -> Step 4`.
- Trình render Markdown gọn nhẹ (hỗ trợ code block, bảng, in đậm/nghiêng).
- Trình phát đa phương tiện: Tự động nhận diện YouTube URL hoặc tệp MP4 LAN nội bộ, hình ảnh phóng to khi click.
- Bộ thẩm định đáp án: Chấm điểm trắc nghiệm, điền khuyết, đúng/sai, tự luận từ khóa.
- Phát âm thanh phản hồi bằng Web Audio API (Đúng: hợp âm vui tươi; Sai: âm trầm nhắc nhở).
- Lắng nghe lệnh điều khiển từ xa từ Gateway (`LOCK_ALL`, `SET_MAX_STEP`, `UNLOCK_ALL`).
- Tự động lưu tiến độ vào `localStorage` và gửi gói tin JSON về Gateway.

- [x] **Bước 1: Viết test logic tiến trình, chấm điểm và tính năng khóa mở tuần tự**
- [x] **Bước 2: Chạy test xác nhận FAIL**
- [x] **Bước 3: Viết mã nguồn hoàn chỉnh cho `js/self_study_engine.js`**
- [x] **Bước 4: Chạy test xác nhận PASS**
- [x] **Bước 5: Commit Git**

---

### Nhiệm Vụ 4: Xây Dựng Trình Soạn Bài Giảng Trực Quan (`js/self_study_editor.js`)
**Tệp:**
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/js/self_study_editor.js`
- Đồng bộ: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/teacher_suite/js/self_study_editor.js`

**Tính năng biên tập viên:**
- Form soạn thảo WYSIWYG 4 bước: Nhập tiêu đề, chọn khối, mục tiêu bài học, dán nội dung lý thuyết Markdown, chèn link ảnh/video, nội dung ghi vở, thêm/xóa câu hỏi trắc nghiệm & điền từ.
- Khung xem trước song song (*Live Preview*) giúp giáo viên nhìn thấy ngay bài học học sinh sẽ thấy.
- Nút **Xuất file JSON**: Tải tệp bài học về máy tính.
- Nút **Nhập file JSON / Excel**: Đọc tệp bài học có sẵn đưa vào trình soạn.
- Nút **Lưu lên Máy Chủ Phòng Máy**: Gửi qua API lưu trực tiếp vào thư mục `lessons/`.
- Hỗ trợ kết nối GitHub API: Soạn bài từ xa ở nhà và lưu thẳng vào repo GitHub `MrKhang-Khoi/cvalms`.

- [x] **Bước 1: Viết test chức năng parse/serialize bài học giữa form và JSON**
- [x] **Bước 2: Chạy test xác nhận FAIL**
- [x] **Bước 3: Hoàn thiện mã nguồn `js/self_study_editor.js`**
- [x] **Bước 4: Chạy test xác nhận PASS**
- [x] **Bước 5: Commit Git**

---

### Nhiệm Vụ 5: Xây Dựng Giao Diện Độc Lập `self_study.html`
**Tệp:**
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/self_study.html`
- Đồng bộ: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/teacher_suite/self_study.html`
- Tạo mới: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/css/self_study.css`

**Giao diện người dùng:**
- **Chế độ Học sinh (Mặc định)**:
  - Header: Logo CVALMS, thanh tiến độ tổng thể, định danh máy trạm (`MAY-01` $\dots$ `MAY-18`), nút Toàn màn hình.
  - Cột trái: Bộ lọc Khối 6-7-8-9, cây danh mục bài giảng SGK, huy hiệu tích xanh hoàn thành.
  - Khung chính: 4 Thẻ bài học tuần tự (Mục tiêu, Khám phá, Ghi vở, Luyện tập) với hiệu ứng khóa mở mượt mà.
  - Màn hình khóa tập trung: Hiển thị khi giáo viên phát lệnh `LOCK_ALL`.
- **Chế độ Giáo viên Soạn bài (`?role=teacher`)**:
  - Thanh công cụ quản trị: Nút Tạo mới, Nạp Excel, Xuất JSON, Lưu máy chủ, Xem trước.
  - Form biên tập 4 bước trực quan.

- [x] **Bước 1: Tạo tệp CSS `css/self_study.css` chuẩn giao diện EdTech quốc tế**
- [x] **Bước 2: Xây dựng cấu trúc HTML chuẩn WCAG trong `self_study.html`**
- [x] **Bước 3: Tích hợp `self_study_engine.js` và `self_study_editor.js`**
- [x] **Bước 4: Kiểm thử hiển thị trên trình duyệt headless / Node DOM check**
- [x] **Bước 5: Commit Git**

---

### Nhiệm Vụ 6: Tích Hợp Vào Giao Diện CVALMS Hiện Có (`index.html`)
**Tệp:**
- Chỉnh sửa: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/index.html`
- Chỉnh sửa: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/teacher_suite/index.html`
- Chỉnh sửa: `OneDrive - Sở GD&ĐT Quảng Ngãi/Desktop/CVALMS_PRO_SUITE/js/live_monitor.js`

**Điểm kết nối:**
- Nút **"Góc Tự Học"** trên thanh header học sinh: Mở trực tiếp `self_study.html` trong chế độ toàn màn hình.
- Nút **"Soạn Bài Tự Học"** trong Tab Studio: Mở trình soạn thảo `self_study.html?role=teacher`.
- Widget **"Giám Sát Tự Học Thời Gian Thực"** trong Tab Monitor: Hiển thị lưới 18 máy (máy nào đang ở bước mấy, điểm số bao nhiêu) kèm cụm 4 nút điều khiển từ xa của Giáo viên:
  - 🔒 **Khóa cả lớp (Focus)**
  - 🔓 **Mở tự do (Free-roam)**
  - ⏸️ **Giới hạn bước (Khóa Bước 3, 4)**
  - 📊 **Xuất bảng điểm Excel**

- [x] **Bước 1: Cập nhật liên kết nút trong `index.html`**
- [x] **Bước 2: Thêm widget giám sát tự học và bảng điều khiển giáo viên vào Tab Monitor**
- [x] **Bước 3: Kết nối luồng nhận tín hiệu WebSocket/HTTP từ Gateway**
- [x] **Bước 4: Kiểm thử tích hợp toàn diện**
- [x] **Bước 5: Commit Git**

---

### Nhiệm Vụ 7: Kiểm Thử Nghiệm Thu Toàn Diện & Đóng Gói Bộ Cài
**Tệp:**
- Chạy: `build_installer.py`
- Kiểm tra: `node --check` cú pháp toàn bộ file JS
- Kiểm tra: Bắn dữ liệu thử nghiệm từ 18 máy trạm ảo để đo tải và độ ổn định Gateway

- [x] **Bước 1: Chạy toàn bộ bộ test tự động (API, Schema, Syntax audit 0 lỗi)**
- [x] **Bước 2: Chạy `build_installer.py` cập nhật bản phân phối `dist/`**
- [x] **Bước 3: Lập báo cáo kết quả nghiệm thu bằng số liệu thực tế**
