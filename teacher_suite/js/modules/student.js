/* ==========================================================
 * STUDENT.JS — Nghiệp vụ Màn hình Học sinh (Pair Learning)
 * Tối giản, tập trung, chống gian lận & nạp PWA siêu tốc
 * ========================================================== */

import { STORE } from '../core/store.js';
import { 
  registerMachineCheckin, 
  submitPollChoice, 
  submitDiscussionAnswer, 
  setSosSignal 
} from '../core/firebase-config.js';

export const STUDENT_MODULE = {
  classesData: null,
  lessonsData: null,

  // Khởi tạo module học sinh
  async init() {
    console.log('[Student] Khởi tạo giao diện học sinh...');
    
    // 1. Nạp dữ liệu lớp học và bài học (đã cache PWA)
    await this.loadLocalData();

    // 2. Nhận diện số máy cố định
    STORE.initFixedMachine();

    // 3. Đăng ký render giao diện theo trạng thái Store
    STORE.subscribe(state => this.render(state));

    // 4. Gắn sự kiện các nút tương tác chung
    this.bindEvents();
    
    // 5. Render lần đầu
    this.render(STORE.getState());
  },

  // Tải dữ liệu JSON nội bộ
  async loadLocalData() {
    try {
      const [clsRes, lsnRes] = await Promise.all([
        fetch('./data/classes.json'),
        fetch('./data/default-lessons.json')
      ]);
      const clsJson = await clsRes.json();
      const lsnJson = await lsnRes.json();
      this.classesData = clsJson.classes;
      this.lessonsData = lsnJson.lessons;
    } catch (e) {
      console.warn('[Student] Mở trực tiếp hoặc không nạp được JSON, tự động chuyển sang dữ liệu dự phòng:', e);
      this.classesData = {
        "10A1": {
          "className": "Lớp 10A1",
          "seatingPlan": {
            "1": ["Lê Hoàng Nam", "Phạm Ngọc Ánh"],
            "2": ["Trần Bảo Long", "Nguyễn Thùy Linh"],
            "3": ["Vũ Đức Minh", "Hoàng Kim Ngân"],
            "4": ["Đỗ Gia Huy", "Bùi Phương Mai"],
            "5": ["Phan Thanh Tùng", "Đặng Thu Trang"]
          }
        }
      };
      this.lessonsData = {
        "tin10_bai12": {
          "title": "Bài 12: Kiểu dữ liệu xâu trong Python",
          "warmup": {
            "question": "Quan sát đoạn mã Python sau và cho biết kết quả in ra màn hình là gì?",
            "code": "s = \"Tin hoc\"\nprint(s[4:])",
            "options": { "A": "\"Tin\"", "B": "\"hoc\"", "C": "\"h\"", "D": "Báo lỗi IndexError" }
          },
          "theory": [
            { "id": "c1", "title": "1. Khái niệm & Khởi tạo Xâu", "summary": "Xâu ký tự (string) trong Python là dãy ký tự đặt trong cặp dấu nháy kép hoặc đơn.", "code": "s1 = 'Xin chao'\ns2 = \"Tin hoc 10\"\nprint(len(s1))  # 8", "note": "Ký tự khoảng trắng cũng được tính là một ký tự." },
            { "id": "c2", "title": "2. Cắt xâu (Slicing)", "summary": "Cú pháp cắt: s[bắt_đầu : kết_thúc]. Lấy từ start đến end - 1.", "code": "s = \"Python\"\nprint(s[0])    # 'P'\nprint(s[1:4])  # 'yth'", "note": "Chỉ số dương tính từ 0 (trái qua), chỉ số âm tính từ -1 (phải qua)." }
          ],
          "discussion": {
            "title": "Nhiệm vụ Thảo luận & Thực hành Nhóm đôi",
            "task": "Cho xâu ký tự: s = 'chuc mung nam moi 2026'\nHai em hãy thảo luận và viết các câu lệnh Python để:\n1. In ra độ dài của xâu s.\n2. Dùng phép cắt xâu (slicing) để trích xuất ra cụm từ 'nam moi'."
          }
        }
      };
    }
  },

  // Gắn sự kiện các nút chung (SOS, Tabs...)
  bindEvents() {
    // Nút giơ tay xin trợ giúp ✋
    const sosBtn = document.getElementById('btn-student-sos');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => {
        const state = STORE.getState();
        if (!state.machineId) return;
        const newSos = !state.isSos;
        STORE.setState({ isSos: newSos });
        setSosSignal(state.machineId, newSos);
      });
    }

    // Nút xác nhận điểm danh đôi
    const confirmBtn = document.getElementById('btn-confirm-checkin');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.handleCheckin());
    }

    // Nút nộp bài thảo luận
    const submitDiscBtn = document.getElementById('btn-submit-discussion');
    if (submitDiscBtn) {
      submitDiscBtn.addEventListener('click', () => this.handleDiscussionSubmit());
    }

    // Các nút chọn Poll A-B-C-D
    document.querySelectorAll('.poll-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const choice = e.currentTarget.dataset.choice;
        this.handlePollSelection(choice);
      });
    });
  },

  // Xử lý học sinh bấm điểm danh vào lớp
  handleCheckin() {
    const state = STORE.getState();
    const machineId = state.machineId || state.fixedMachineId;
    if (!machineId) {
      alert('Chưa xác định được số máy của bạn!');
      return;
    }

    const students = state.students || [];
    STORE.setState({ currentPhase: 'ready' });
    registerMachineCheckin(state.classId, machineId, students);
    console.log(`[Student] Máy ${machineId} đã vào lớp với HS:`, students);
  },

  // Xử lý học sinh chọn đáp án Quick Poll
  handlePollSelection(choice) {
    const state = STORE.getState();
    if (state.pollLocked) return;

    STORE.setState({ pollSelection: choice });
    submitPollChoice(state.machineId, choice);
    console.log(`[Student Poll] Máy ${state.machineId} chọn đáp án:`, choice);
  },

  // Xử lý nộp bài thảo luận
  handleDiscussionSubmit() {
    const state = STORE.getState();
    const input = document.getElementById('disc-answer-input');
    const content = input ? input.value.trim() : '';

    if (!content) {
      alert('Vui lòng nhập nội dung hoặc mã code bài làm của nhóm bạn!');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    STORE.setState({ 
      discStatus: 'submitted',
      discSubmissionTime: timeStr 
    });

    submitDiscussionAnswer(state.machineId, content, state.students);
  },

  // Điều phối hiển thị giao diện theo chặng bài học
  render(state) {
    const { currentPhase, fixedMachineId, machineId, students, _classId, isSos } = state;

    // 1. Cập nhật thanh tiêu đề học sinh
    const machineBadge = document.getElementById('sh-machine-badge');
    if (machineBadge) {
      machineBadge.textContent = machineId ? `Máy ${machineId}` : (fixedMachineId ? `Máy ${fixedMachineId}` : 'Chưa định danh');
    }

    const studentsLabel = document.getElementById('sh-students-label');
    if (studentsLabel) {
      studentsLabel.textContent = students && students.length > 0 ? students.join(' & ') : 'Chưa điểm danh';
    }

    // Nút SOS trạng thái
    const sosBtn = document.getElementById('btn-student-sos');
    if (sosBtn) {
      sosBtn.classList.toggle('active', isSos);
      sosBtn.replaceChildren();
      const sosIcon = document.createElement('i');
      sosIcon.className = 'fas fa-hand-paper';
      sosBtn.appendChild(sosIcon);
      sosBtn.appendChild(document.createTextNode(isSos ? ' Đã gọi thầy' : ' Cần trợ giúp'));
    }

    // 2. Điều hướng màn hình (Views)
    const viewWaiting = document.getElementById('st-view-waiting');
    const viewSeating = document.getElementById('st-view-seating');
    const viewReady = document.getElementById('st-view-ready');
    const viewWarmup = document.getElementById('st-view-warmup');
    const viewTheory = document.getElementById('st-view-theory');
    const viewDiscussion = document.getElementById('st-view-discussion');
    const viewQuiz = document.getElementById('st-view-quiz');

    const views = [viewWaiting, viewSeating, viewReady, viewWarmup, viewTheory, viewDiscussion, viewQuiz];
    views.forEach(v => { if (v) v.style.display = 'none'; });

    // Hiển thị view tương ứng
    if (currentPhase === 'waiting' || !state.sessionStatus || state.sessionStatus === 'idle') {
      if (viewWaiting) viewWaiting.style.display = 'flex';
    } else if (currentPhase === 'seating') {
      if (viewSeating) {
        viewSeating.style.display = 'flex';
        this.renderSeatingCard(state);
      }
    } else if (currentPhase === 'ready') {
      if (viewReady) viewReady.style.display = 'flex';
    } else if (currentPhase === 'warmup') {
      if (viewWarmup) {
        viewWarmup.style.display = 'flex';
        this.renderWarmupView(state);
      }
    } else if (currentPhase === 'theory') {
      if (viewTheory) {
        viewTheory.style.display = 'flex';
        this.renderTheoryView(state);
      }
    } else if (currentPhase === 'discussion') {
      if (viewDiscussion) {
        viewDiscussion.style.display = 'grid';
        this.renderDiscussionView(state);
      }
    } else if (currentPhase === 'quiz') {
      if (viewQuiz) viewQuiz.style.display = 'flex';
    }
  },

  // Hiển thị Thẻ Điểm danh tự động Map 2 học sinh
  renderSeatingCard(state) {
    const cardTitle = document.getElementById('seating-card-title');
    const pairNames = document.getElementById('seating-pair-names');
    const mId = state.machineId || state.fixedMachineId || 1;

    // Tìm trong dữ liệu lớp để map tên 2 học sinh
    let pair = ['Học sinh 1', 'Học sinh 2'];
    if (this.classesData && state.classId && this.classesData[state.classId]) {
      const cls = this.classesData[state.classId];
      if (cls.seatingPlan && cls.seatingPlan[mId.toString()]) {
        pair = cls.seatingPlan[mId.toString()].filter(n => n.trim() !== '');
      }
    }

    state.machineId = mId;
    state.students = pair;

    if (cardTitle) cardTitle.textContent = `🖥️ MÁY BÀN SỐ ${mId} — ${state.classId || 'LỚP HỌC'}`;
    if (pairNames) {
      pairNames.replaceChildren();
      if (pair.length > 1) {
        pair.forEach(name => {
          const div = document.createElement('div');
          div.className = 'pair-tag';
          const icon = document.createElement('i');
          icon.className = 'fas fa-user-graduate';
          div.append(icon, document.createTextNode(` ${name}`));
          pairNames.appendChild(div);
        });
      } else {
        const div = document.createElement('div');
        div.className = 'pair-tag';
        const icon = document.createElement('i');
        icon.className = 'fas fa-user-graduate';
        div.append(icon, document.createTextNode(` ${pair[0]} (Ngồi 1 mình)`));
        pairNames.appendChild(div);
      }
    }
  },

  // Hiển thị Chặng 1: Quick Poll A-B-C-D
  renderWarmupView(state) {
    const q = state.lessonData?.warmup || {
      question: "Câu hỏi thăm dò nhanh từ Giáo viên trên bảng:",
      options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" }
    };

    const qText = document.getElementById('poll-question-text');
    if (qText) qText.textContent = q.question;

    const codeBox = document.getElementById('poll-code-snippet');
    if (codeBox) {
      if (q.code) {
        codeBox.style.display = 'block';
        codeBox.textContent = q.code;
      } else {
        codeBox.style.display = 'none';
      }
    }

    // Cập nhật trạng thái nút đã chọn
    document.querySelectorAll('.poll-opt-btn').forEach(btn => {
      const choice = btn.dataset.choice;
      const isSelected = state.pollSelection === choice;
      btn.classList.toggle('selected', isSelected);
      btn.disabled = state.pollLocked;
    });

    const statusMsg = document.getElementById('poll-status-msg');
    if (statusMsg) {
      statusMsg.replaceChildren();
      if (state.pollSelection) {
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check-circle';
        checkIcon.style.color = 'var(--success)';
        const strongEl = document.createElement('strong');
        strongEl.textContent = `Đáp án ${state.pollSelection}`;
        statusMsg.append(checkIcon, document.createTextNode(' Đã ghi nhận lựa chọn: '), strongEl, document.createTextNode('. Chờ giáo viên công bố!'));
      } else {
        statusMsg.textContent = 'Hai em hãy trao đổi nhanh và bấm chọn 1 đáp án:';
      }
    }
  },

  // Hiển thị Chặng 2: Trạm Lý thuyết PWA NotebookLM
  renderTheoryView(state) {
    const container = document.getElementById('theory-cards-container');
    if (!container) return;

    container.replaceChildren();
    const cards = state.lessonData?.theory || [];
    cards.forEach(c => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'theory-card';

      const h3 = document.createElement('h3');
      h3.className = 'theory-card-title';
      const icon = document.createElement('i');
      icon.className = 'fas fa-bookmark';
      h3.append(icon, document.createTextNode(` ${c.title}`));

      const p = document.createElement('p');
      p.className = 'theory-card-summary';
      p.textContent = c.summary;

      cardDiv.append(h3, p);

      if (c.code) {
        const pre = document.createElement('pre');
        pre.className = 'code-block';
        const code = document.createElement('code');
        code.textContent = c.code;
        pre.appendChild(code);
        cardDiv.appendChild(pre);
      }

      if (c.note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'theory-card-note';
        const noteIcon = document.createElement('i');
        noteIcon.className = 'fas fa-info-circle';
        noteDiv.append(noteIcon, document.createTextNode(` ${c.note}`));
        cardDiv.appendChild(noteDiv);
      }

      container.appendChild(cardDiv);
    });
  },

  // Hiển thị Chặng 3: Thảo luận & Thực hành đôi
  renderDiscussionView(state) {
    const taskBox = document.getElementById('disc-task-description');
    const disc = state.lessonData?.discussion;
    if (taskBox && disc) {
      taskBox.replaceChildren();
      const h3 = document.createElement('h3');
      const icon = document.createElement('i');
      icon.className = 'fas fa-tasks';
      h3.append(icon, document.createTextNode(` ${disc.title}`));
      const p = document.createElement('p');
      p.style.whiteSpace = 'pre-line';
      p.textContent = disc.task;
      taskBox.append(h3, p);
    }

    // Hiển thị lý thuyết tham khảo thu gọn bên trái
    const refContainer = document.getElementById('disc-theory-reference');
    if (refContainer) {
      refContainer.replaceChildren();
      const cards = state.lessonData?.theory || [];
      cards.forEach(c => {
        const refCard = document.createElement('div');
        refCard.className = 'ref-card';
        const h4 = document.createElement('h4');
        h4.textContent = c.title;
        refCard.appendChild(h4);

        if (c.code) {
          const pre = document.createElement('pre');
          pre.className = 'code-block mini';
          const code = document.createElement('code');
          code.textContent = c.code;
          pre.appendChild(code);
          refCard.appendChild(pre);
        }
        refContainer.appendChild(refCard);
      });
    }

    // Trạng thái nộp bài
    const statusEl = document.getElementById('disc-submission-status');
    const submitBtn = document.getElementById('btn-submit-discussion');
    if (statusEl) {
      statusEl.replaceChildren();
      if (state.discStatus === 'submitted') {
        const badge = document.createElement('span');
        badge.className = 'badge-success';
        const icon = document.createElement('i');
        icon.className = 'fas fa-check';
        badge.append(icon, document.createTextNode(` Đã nộp bài lúc ${state.discSubmissionTime || ''}`));
        statusEl.append(badge, document.createTextNode(' (Có thể sửa và nộp lại nếu còn giờ)'));

        if (submitBtn) {
          submitBtn.replaceChildren();
          const btnIcon = document.createElement('i');
          btnIcon.className = 'fas fa-redo';
          submitBtn.append(btnIcon, document.createTextNode(' CẬP NHẬT LẠI BÀI LÀM'));
        }
      } else {
        const badge = document.createElement('span');
        badge.className = 'badge-warning';
        const icon = document.createElement('i');
        icon.className = 'fas fa-clock';
        badge.append(icon, document.createTextNode(' Đang làm bài...'));
        statusEl.appendChild(badge);

        if (submitBtn) {
          submitBtn.replaceChildren();
          const btnIcon = document.createElement('i');
          btnIcon.className = 'fas fa-paper-plane';
          submitBtn.append(btnIcon, document.createTextNode(' GỬI BÀI LÀM CỦA MÁY'));
        }
      }
    }
  }
};
