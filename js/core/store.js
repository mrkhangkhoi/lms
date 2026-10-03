/* ==========================================================
 * STORE.JS — Quản lý Trạng thái Tập trung (Single Source of Truth)
 * ========================================================== */

export const STORE = {
  // Trạng thái cục bộ của máy
  state: {
    role: 'student',
    fixedMachineId: null,      // Số máy cố định (1 - 18)
    machineId: null,           // Số máy trong phiên
    students: [],              // Danh sách 2 học sinh ngồi máy này
    classId: null,             // Lớp đang học (ví dụ: '10A1')
    lessonId: null,            // Mã bài đang học (ví dụ: 'tin10_bai12')
    lessonData: null,          // Nội dung chi tiết bài học từ NotebookLM
    currentPhase: 'waiting',   // 'waiting' | 'seating' | 'warmup' | 'theory' | 'discussion' | 'quiz' | 'summary'
    sessionStatus: 'idle',     // 'idle' | 'running' | 'locked' | 'ended'
    timerRemaining: 0,         // Thời gian đếm ngược còn lại
    pollSelection: null,       // Lựa chọn Chặng 1 của máy ('A'|'B'|'C'|'D')
    pollLocked: false,         // Trạng thái khóa poll
    discStatus: 'working',     // 'working' | 'submitted'
    discSubmissionTime: null,  // Thời gian nộp bài thảo luận
    isSos: false,              // Trạng thái giơ tay xin trợ giúp
    appVersion: '2.0.1'        // Phiên bản client
  },

  // Đăng ký lắng nghe thay đổi trạng thái
  listeners: [],

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  },

  // Cập nhật trạng thái
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(fn => {
      try { fn(this.state); } catch (e) { console.error('[Store Error]:', e); }
    });
  },

  getState() {
    return this.state;
  },

  // Khởi tạo máy cố định từ URL (?set_machine=X) hoặc LocalStorage
  initFixedMachine() {
    const params = new URLSearchParams(window.location.search);
    const setMachineParam = params.get('set_machine');

    if (setMachineParam) {
      const num = parseInt(setMachineParam, 10);
      if (num >= 1 && num <= 18) {
        localStorage.setItem('lms_fixed_machine_id', num.toString());
        this.setState({ fixedMachineId: num, machineId: num });
        console.log(`[Machine Identity] Đã khóa cố định máy: Máy ${num}`);
        // Xóa tham số URL để giao diện sạch sẽ
        window.history.replaceState({}, document.title, window.location.pathname);
        return num;
      }
    }

    const saved = localStorage.getItem('lms_fixed_machine_id');
    if (saved) {
      const num = parseInt(saved, 10);
      this.setState({ fixedMachineId: num, machineId: num });
      console.log(`[Machine Identity] Đọc từ bộ nhớ máy: Máy ${num}`);
      return num;
    }

    return null;
  }
};
