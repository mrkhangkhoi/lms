# Dynamic Lesson Builder & Video Validator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi module tự học CVALMS sang kiến trúc bài học động đa mục (Dynamic Sections/Blocks), tích hợp công cụ kiểm tra video đa nguồn (YouTube/Drive/MP4) trực tiếp trong Studio soạn bài, và sửa lỗi hiển thị video cho học sinh.

**Architecture:** 
- Mô hình bài học dạng Module/Section động (`lesson.sections = [...]`) thay thế cho 4 bước cứng cũ, có bộ Adapter chuẩn hóa tự động để tương thích 100% với các bài học cũ.
- Engine kiểm tra Video đa nguồn (Universal Video Validator & Embedder) hỗ trợ YouTube (ID, shorts, share link), Google Drive preview, file MP4 máy chủ LAN và HTML5 video; cấu hình DOMPurify cho phép thẻ `iframe` và `video`.
- Giao diện Authoring Studio cho phép Giáo viên thêm/xóa/đổi thứ tự mục, gắn media và kiểm tra trực tiếp qua nút "Kiểm tra video".
- Trình phát học sinh (`self_study_app.js`) sinh stepper động theo số lượng mục của bài học.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5 Video API, YouTube Iframe API, DOMPurify whitelist, Node.js assert tests.

**Spec:** Option A - Dynamic Lesson Architecture + Pre-flight Video Validator.

## Global Constraints
- Zero external build dependencies (no webpack, no npm bundle needed at runtime).
- 100% backward compatibility with existing `self_study_data.js` (Tin 6, 7, 8, 9).
- Anti-tamper & Teacher PIN security preserved.
- Code style: Safe DOM manipulation, strict equality `===`, zero `var`.

## Review Focus
1. Link YouTube có tham số phức tạp (`?si=...`, `&t=30s`, shorts URL): Regex phải bóc tách đúng 11 ký tự Video ID.
2. Link Google Drive (`drive.google.com/file/d/.../view`): Phải tự động chuyển đổi sang `/preview` để nhúng iframe được.
3. DOMPurify sanitize: Bắt buộc cấu hình whitelist thẻ `iframe`, `video`, `source` cùng các thuộc tính `allow`, `allowfullscreen`, `controls`.
4. Bài học cũ chỉ có `step1_objectives`, `step2_theory`, v.v.: Adapter phải tự động chuyển thành `sections` chuẩn mà không làm hỏng dữ liệu gốc.
5. Stepper học sinh: Khi bài học có 3 hoặc 5 mục thay vì 4, thanh tiến trình và nút chuyển bước phải tự động tính toán đúng tỷ lệ %.

---

### Task 1: Module Kiểm tra & Trích xuất Video Đa Nguồn (Universal Media Engine)

**Files:**
- Create/Modify: `teacher_suite/js/self_study_media.js` và `js/self_study_media.js`
- Test: `tests/test_self_study_media.js`

**Interfaces:**
- Produces:
  - `parseMediaSource(url)`: Nhận diện loại media (`youtube`, `gdrive`, `direct_video`, `image`, `unknown`) và trích xuất URL nhúng (`embedUrl`, `ytId`).
  - `validateMediaUrl(url, timeoutMs)`: Kiểm tra tính khả dụng của link video, trả về `{ ok: boolean, type: string, embedUrl: string, message: string }`.
  - `renderMediaHtml(media)`: Tạo HTML iframe/video an toàn với fallback.

- [ ] **Step 1: Viết test failing `tests/test_self_study_media.js`**
- [ ] **Step 2: Chạy test để xác nhận FAIL**
- [ ] **Step 3: Cài đặt `self_study_media.js` với bộ parser YouTube, Google Drive, MP4, và DOMPurify config**
- [ ] **Step 4: Chạy test để xác nhận PASS**
- [ ] **Step 5: Đồng bộ file giữa `js/` và `teacher_suite/js/`**

---

### Task 2: Cấu trúc Dữ liệu Bài học Động & Adapter Tương thích ngược

**Files:**
- Modify: `teacher_suite/js/self_study_data.js`, `js/self_study_data.js`
- Modify: `teacher_suite/js/self_study_editor.js`, `js/self_study_editor.js`
- Test: `tests/test_dynamic_lesson_schema.js`

**Interfaces:**
- Produces:
  - `normalizeLessonToSections(lesson)`: Chuẩn hóa bài học 4 bước cũ thành mảng `sections`.
  - `SelfStudyEditor.prototype.addSection(type, title)`
  - `SelfStudyEditor.prototype.removeSection(index)`
  - `SelfStudyEditor.prototype.moveSection(index, direction)`

- [ ] **Step 1: Viết test failing `tests/test_dynamic_lesson_schema.js`**
- [ ] **Step 2: Chạy test để xác nhận FAIL**
- [ ] **Step 3: Cài đặt hàm chuẩn hóa `normalizeLessonToSections` và các method quản lý section trong `self_study_editor.js`**
- [ ] **Step 4: Chạy test để xác nhận PASS**
- [ ] **Step 5: Kiểm tra tính toàn vẹn của kho dữ liệu `self_study_data.js`**

---

### Task 3: Giao diện Studio Soạn Bài Động & Nút "Kiểm tra Video"

**Files:**
- Modify: `teacher_suite/self_study.html`, `self_study.html`
- Modify: `teacher_suite/js/self_study_app.js`, `js/self_study_app.js`
- Modify: `teacher_suite/css/self_study.css`, `css/self_study.css`

**Interfaces:**
- Produces:
  - Giao diện UI: Danh sách các Section động trong Studio với nút `+ Thêm mục`, nút `Xóa`, nút `▲ Lên`, `▼ Xuống`.
  - Nút "Kiểm tra video" (Test Video) kèm khung preview player hiển thị ngay bên dưới ô nhập URL.
  - Phản hồi trực quan: Badge trạng thái (YouTube HD / Google Drive / MP4 Local / Lỗi đường dẫn).

- [ ] **Step 1: Cập nhật CSS cho Section Builder card và Video Preview Box trong `self_study.css`**
- [ ] **Step 2: Tích hợp nút Kiểm tra Video và container Preview trong `self_study.html`**
- [ ] **Step 3: Cài đặt sự kiện click `btnTestVideo` và logic render danh sách Section động trong `self_study_app.js`**
- [ ] **Step 4: Kiểm tra tương tác mở modal/studio và kiểm tra video trực quan**

---

### Task 4: Nâng cấp Trình Phát Học sinh (Student Player Dynamic Stepper)

**Files:**
- Modify: `teacher_suite/js/self_study_app.js`, `js/self_study_app.js`
- Modify: `teacher_suite/self_study.html`, `self_study.html`
- Test: `tests/test_e2e_dynamic_player.js`

**Interfaces:**
- Produces:
  - Hàm `renderDynamicStepper(sections)`: Sinh số lượng bước trên header tương ứng với số mục trong bài.
  - Hàm `renderCurrentSection(sectionIndex)`: Render nội dung linh hoạt theo `type` (objectives, theory, notebook, quiz, practice).
  - Tự động bật iframe YouTube/Video an toàn, không bị DOMPurify lọc mất.

- [ ] **Step 1: Viết test failing `tests/test_e2e_dynamic_player.js`**
- [ ] **Step 2: Chạy test để xác nhận FAIL**
- [ ] **Step 3: Cập nhật luồng hiển thị stepper động và phát video trong `self_study_app.js`**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Chạy toàn bộ test suite (`node tests/test_*.js`) đảm bảo 0 regressions**
