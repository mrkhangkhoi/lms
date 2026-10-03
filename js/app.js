/* ==========================================================
 * APP.JS — Khởi động Ứng dụng LMS Phòng Máy Tương Tác
 * Quản lý vòng đời PWA, kết nối và định tuyến màn hình
 * ========================================================== */

import { STORE } from './core/store.js';
import { initFirebase, listenActiveSession } from './core/firebase-config.js';
import { STUDENT_MODULE } from './modules/student.js';

// 1. Đăng ký PWA Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[PWA] Service Worker đã đăng ký thành công:', reg.scope))
        .catch(err => console.warn('[PWA] Đăng ký Service Worker thất bại:', err));
    });
  }
}

// 2. Khởi động ứng dụng
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[App] Khởi động hệ thống LMS 18 Máy (v2.0.1)...');
  
  // Đăng ký Service Worker
  registerServiceWorker();

  // Khởi tạo Firebase
  initFirebase();

  // Khởi tạo giao diện học sinh
  await STUDENT_MODULE.init();

  // Lắng nghe tín hiệu phiên học thời gian thực từ Giáo viên
  listenActiveSession(sessionData => {
    if (!sessionData) {
      STORE.setState({ 
        sessionStatus: 'idle',
        currentPhase: 'waiting'
      });
      return;
    }

    console.log('[Realtime Signal] Nhận trạng thái phiên từ Giáo viên:', sessionData);

    STORE.setState({
      classId: sessionData.classId || '10A1',
      lessonId: sessionData.lessonId,
      lessonData: sessionData.lessonData,
      currentPhase: sessionData.currentPhase || 'waiting',
      sessionStatus: sessionData.status || 'running',
      timerRemaining: sessionData.timerRemaining || 0,
      pollLocked: sessionData.pollLocked || false
    });
  });

  // Hỗ trợ kiểm thử nhanh các chặng trực tiếp trên giao diện
  window.setTestPhase = function(phase) {
    console.log(`[Test Mode] Chuyển thử nghiệm sang chặng: ${phase}`);
    STORE.setState({
      classId: '10A1',
      sessionStatus: 'running',
      currentPhase: phase,
      machineId: 4,
      lessonData: {
        warmup: {
          question: "Quan sát đoạn mã Python sau và cho biết kết quả:",
          code: "s = 'Tin hoc'\nprint(s[4:])",
          options: { A: "'Tin'", B: "'hoc'", C: "'h'", D: "Lỗi IndexError" }
        },
        theory: [
          { id: 'c1', title: '1. Khái niệm & Khởi tạo Xâu', summary: 'Xâu ký tự (string) trong Python là dãy ký tự đặt trong cặp dấu nháy kép hoặc đơn.', code: "s1 = 'Xin chao'\ns2 = \"Tin hoc 10\"\nprint(len(s1))  # 8", note: "Ký tự khoảng trắng cũng được tính là một ký tự." },
          { id: 'c2', title: '2. Cắt xâu (Slicing)', summary: 'Cú pháp cắt: s[bắt_đầu : kết_thúc]. Lấy từ start đến end - 1.', code: "s = \"Python\"\nprint(s[0])    # 'P'\nprint(s[1:4])  # 'yth'", note: "Chỉ số dương tính từ 0 (trái qua), chỉ số âm tính từ -1 (phải qua)." }
        ],
        discussion: {
          title: "Nhiệm vụ Thảo luận & Thực hành Nhóm đôi",
          task: "Cho xâu ký tự: s = 'chuc mung nam moi 2026'\nHai em hãy thảo luận và viết các câu lệnh Python để:\n1. In ra độ dài của xâu s.\n2. Dùng phép cắt xâu (slicing) để trích xuất ra cụm từ 'nam moi'."
        }
      }
    });
  };
});
