/* ==========================================================
 * SELF_STUDY.JS — PHÂN HỆ TỰ HỌC CÁ NHÂN HÓA (CVALMS PRO)
 * Chuẩn Thiết kế Google Stitch & Kiến trúc Tuần tự (Gated Progression)
 * Độc lập 100%, bảo toàn mã nguồn cũ, hỗ trợ Offline & LAN
 * ========================================================== */

(function () {
  'use strict';

  const sanitizeHTML = (h) => (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(h) : h);

  // 1. KHO BÀI DẠY TỰ HỌC CHUẨN GDPT 2018 (KHỐI 6, 7, 8, 9)
  const LESSONS_DB = {
    'tin6_bai12': {
      id: 'tin6_bai12',
      grade: '6',
      title: 'Bài 12: Thuật toán và sơ đồ khối',
      subtitle: 'Môn Tin học 6 • Chương trình GDPT 2018',
      duration: '35 phút',
      step1: {
        title: 'Mục Tiêu Bài Học & Yêu Cầu Cần Đạt',
        items: [
          'Nêu được khái niệm thuật toán và nhận biết thuật toán trong đời sống.',
          'Biết và vẽ đúng các ký hiệu chuẩn trong sơ đồ khối (Bắt đầu, Xử lý, Điều kiện, Vào/Ra dữ liệu).',
          'Biểu diễn được một thuật toán đơn giản bằng sơ đồ khối.'
        ],
        btnConfirm: 'Em đã hiểu rõ mục tiêu bài học'
      },
      step2: {
        title: 'Lý Thuyết Trọng Tâm & Ví Dụ Minh Họa',
        conceptTitle: '1. Khái niệm Thuật toán & Sơ đồ khối',
        conceptBody: 'Thuật toán là một dãy hữu hạn các thao tác được sắp xếp theo một trình tự xác định nhằm giải quyết một nhiệm vụ hoặc bài toán cụ thể. Sơ đồ khối là công cụ trực quan hóa thuật toán bằng các hình học quy ước.',
        shapes: [
          { name: 'Hình Oval (Elip)', meaning: 'Bắt đầu (Start) hoặc Kết thúc (End) thuật toán', color: '#10b981' },
          { name: 'Hình Chữ nhật', meaning: 'Thao tác tính toán, xử lý dữ liệu', color: '#38bdf8' },
          { name: 'Hình Thoi', meaning: 'Kiểm tra điều kiện rẽ nhánh (Đúng hoặc Sai)', color: '#f59e0b' },
          { name: 'Hình Bình hành', meaning: 'Nhập dữ liệu (Input) hoặc Xuất kết quả (Output)', color: '#a855f7' }
        ],
        exampleTitle: '2. Ví dụ thực tế: Thuật toán pha trà mời khách',
        exampleSteps: [
          'Bước 1: Tráng ấm chén bằng nước sôi nóng.',
          'Bước 2: Cho một lượng trà mạn vừa đủ vào ấm.',
          'Bước 3: Rót nước sôi vào ấm, đậy nắp và đợi trong 3 phút.',
          'Bước 4: Rót trà ra chén và mời khách thưởng thức.'
        ],
        btnConfirm: 'Em đã nắm vững lý thuyết và ví dụ'
      },
      step3: {
        title: 'Nội Dung Cốt Lõi Em Ghi Vào Vở',
        badge: 'GHI VÀO VỞ HỌC',
        contentLines: [
          '1. Thuật toán: Là dãy các thao tác tuần tự để giải quyết một bài toán xác định.',
          '2. Hai cách mô tả thuật toán: (1) Liệt kê các bước; (2) Dùng sơ đồ khối.',
          '3. Quy ước sơ đồ khối: Hình Elip (Bắt đầu/Kết thúc), Hình chữ nhật (Xử lý), Hình thoi (Điều kiện rẽ nhánh), Mũi tên (Hướng đi).'
        ],
        btnConfirm: 'Em đã ghi chép đầy đủ các mục trên vào vở'
      },
      step4: {
        title: 'Thử Thách Luyện Tập & Chốt Kiến Thức',
        cloze: {
          questionText: 'Sơ đồ khối là công cụ dùng để biểu diễn',
          blankPlaceholder: '[ Chọn từ khuyết ]',
          afterText: 'bằng các hình vẽ quy ước trực quan.',
          options: ['phần cứng', 'thuật toán', 'bàn phím', 'mạng wifi'],
          correct: 'thuật toán',
          explanation: 'Chính xác! Sơ đồ khối dùng các hình hình học trực quan để mô tả các bước của thuật toán.'
        },
        quiz: {
          question: 'Trong sơ đồ khối, hình nào được dùng để kiểm tra ĐIỀU KIỆN (rẽ nhánh)?',
          options: [
            'A. Hình chữ nhật',
            'B. Hình thoi',
            'C. Hình bầu dục (Oval)',
            'D. Hình bình hành'
          ],
          correctIndex: 1,
          explanation: 'Chính xác! Hình thoi thể hiện thao tác kiểm tra điều kiện logic (Đúng hoặc Sai).'
        }
      }
    },
    'tin6_bai1': {
      id: 'tin6_bai1',
      grade: '6',
      title: 'Bài 01: Thông tin và thu nhận thông tin',
      subtitle: 'Môn Tin học 6 • Chương trình GDPT 2018',
      duration: '30 phút',
      step1: {
        title: 'Mục Tiêu Bài Học & Yêu Cầu Cần Đạt',
        items: [
          'Phân biệt được thông tin và vật mang tin.',
          'Nêu được ví dụ về các giác quan thu nhận thông tin của con người.',
          'Hiểu được tầm quan trọng của thông tin trong đời sống hàng ngày.'
        ],
        btnConfirm: 'Em đã hiểu rõ mục tiêu bài học'
      },
      step2: {
        title: 'Lý Thuyết Trọng Tâm & Ví Dụ Minh Họa',
        conceptTitle: '1. Thông tin và Vật mang tin',
        conceptBody: 'Thông tin là những hiểu biết của con người về thế giới xung quanh và về chính bản thân mình. Vật mang tin là phương tiện chứa đựng hoặc truyền tải thông tin (sách, báo, USB, màn hình).',
        shapes: [
          { name: 'Thị giác (Mắt)', meaning: 'Thu nhận thông tin hình ảnh, màu sắc, chữ viết', color: '#38bdf8' },
          { name: 'Thính giác (Tai)', meaning: 'Thu nhận thông tin âm thanh, tiếng nói, tiếng chuông', color: '#10b981' },
          { name: 'Vật mang tin', meaning: 'Sách giáo khoa, bảng tin, đĩa từ, thẻ nhớ...', color: '#f59e0b' }
        ],
        exampleTitle: '2. Ví dụ thực tế: Tiếng trống trường',
        exampleSteps: [
          'Tiếng trống trường vang lên: Là thông tin dạng âm thanh.',
          'Mặt trống rung: Là nguồn phát sinh âm thanh.',
          'Học sinh hiểu là: Đã đến giờ vào lớp (Xử lý thông tin).'
        ],
        btnConfirm: 'Em đã nắm vững lý thuyết và ví dụ'
      },
      step3: {
        title: 'Nội Dung Cốt Lõi Em Ghi Vào Vở',
        badge: 'GHI VÀO VỞ HỌC',
        contentLines: [
          '1. Thông tin: Toàn bộ những hiểu biết của con người về thế giới xung quanh.',
          '2. Vật mang tin: Vật chứa và truyền tải thông tin (Ví dụ: tờ giấy, tấm ảnh, ổ cứng).',
          '3. Các dạng thông tin chính: Dạng chữ và số, dạng hình ảnh, dạng âm thanh.'
        ],
        btnConfirm: 'Em đã ghi chép đầy đủ các mục trên vào vở'
      },
      step4: {
        title: 'Thử Thách Luyện Tập & Chốt Kiến Thức',
        cloze: {
          questionText: 'Vật chứa và truyền tải thông tin được gọi là',
          blankPlaceholder: '[ Chọn từ khuyết ]',
          afterText: 'trong tin học.',
          options: ['vật mang tin', 'phần mềm', 'máy in', 'dây cáp'],
          correct: 'vật mang tin',
          explanation: 'Chính xác! Vật mang tin là vật chứa đựng và lưu giữ thông tin (như sách, USB, thẻ nhớ).'
        },
        quiz: {
          question: 'Tiếng còi xe cứu thương trên đường thuộc dạng thông tin nào?',
          options: [
            'A. Dạng hình ảnh',
            'B. Dạng âm thanh',
            'C. Dạng văn bản chữ viết',
            'D. Dạng số học'
          ],
          correctIndex: 1,
          explanation: 'Chính xác! Tiếng còi cứu thương là thông tin dạng âm thanh được thu nhận qua thính giác.'
        }
      }
    }
  };

  // 2. MÁY TRẠNG THÁI TIẾN TRÌNH (STATE MANAGEMENT)
  const STATE = {
    currentLessonId: 'tin6_bai12',
    progress: {
      step1: false, // Mục tiêu
      step2: false, // Lý thuyết
      step3: false, // Ghi vở
      clozeDone: false, // Điền khuyết
      quizDone: false,  // Trắc nghiệm
      completed: false  // 100%
    }
  };

  const STORAGE_PREFIX = 'cvalms_selfstudy_';

  function getStorageKey(lessonId) {
    return `${STORAGE_PREFIX}${lessonId}`;
  }

  function loadProgress(lessonId) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(getStorageKey(lessonId));
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('[SelfStudy] Không đọc được localStorage, dùng trạng thái mặc định.');
    }
    return {
      step1: false,
      step2: false,
      step3: false,
      clozeDone: false,
      quizDone: false,
      completed: false
    };
  }

  function saveProgress(lessonId, prog) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(getStorageKey(lessonId), JSON.stringify(prog));
      }
    } catch (e) {
      console.warn('[SelfStudy] Không ghi được localStorage.');
    }
  }

  function calculatePercent(prog) {
    let p = 0;
    if (prog.step1) p += 25;
    if (prog.step2) p += 25;
    if (prog.step3) p += 25;
    if (prog.clozeDone && prog.quizDone) {
      p += 25;
    } else if (prog.clozeDone || prog.quizDone) {
      p += 12;
    }
    return Math.min(100, p);
  }

  // 3. RENDER GIAO DIỆN BÀI HỌC (TYPE-SAFE UI BUILDER)
  function renderSelfStudyView(lessonId) {
    const lesson = LESSONS_DB[lessonId];
    if (!lesson) return;

    STATE.currentLessonId = lessonId;
    STATE.progress = loadProgress(lessonId);

    const container = document.getElementById('selfstudy-content-container');
    if (!container) return;

    const percent = calculatePercent(STATE.progress);
    updateTopProgress(lesson.title, percent);
    updateSidebarActive(lessonId);

    // Xây dựng 4 khối thẻ bài học tuần tự
    container.innerHTML = sanitizeHTML(`
      <!-- KHỐI 1: MỤC TIÊU BÀI HỌC -->
      <section class="cvalms-selfstudy-card ${STATE.progress.step1 ? 'is-completed' : 'is-active'}" id="ss-card-step1">
        <div class="ss-card-header">
          <div class="ss-card-badge"><i class="fas fa-bullseye"></i> BƯỚC 1</div>
          <h3 class="ss-card-title">${lesson.step1.title}</h3>
          <span class="ss-status-pill">${STATE.progress.step1 ? '✓ Đã hoàn thành' : 'Đang học'}</span>
        </div>
        <div class="ss-card-body">
          <p class="ss-guidance-text"><i class="fas fa-info-circle"></i> Em hãy đọc kỹ các yêu cầu cần đạt dưới đây để xác định mục tiêu học tập:</p>
          <ul class="ss-objectives-list">
            ${lesson.step1.items.map(it => `<li><i class="fas fa-check-circle" style="color:#38bdf8;"></i> ${it}</li>`).join('')}
          </ul>
        </div>
        <div class="ss-card-footer">
          <button type="button" class="ss-btn ss-btn-primary ${STATE.progress.step1 ? 'ss-btn-done' : ''}" id="btn-confirm-step1">
            <i class="fas ${STATE.progress.step1 ? 'fa-check-double' : 'fa-arrow-right'}"></i> 
            ${STATE.progress.step1 ? '✓ Đã xác nhận mục tiêu' : lesson.step1.btnConfirm}
          </button>
        </div>
      </section>

      <!-- KHỐI 2: LÝ THUYẾT & VÍ DỤ MINH HỌA -->
      <section class="cvalms-selfstudy-card ${!STATE.progress.step1 ? 'is-locked' : (STATE.progress.step2 ? 'is-completed' : 'is-active')}" id="ss-card-step2">
        <div class="ss-card-header">
          <div class="ss-card-badge"><i class="fas fa-book-open"></i> BƯỚC 2</div>
          <h3 class="ss-card-title">${lesson.step2.title}</h3>
          <span class="ss-status-pill">${!STATE.progress.step1 ? '🔒 Đang khóa' : (STATE.progress.step2 ? '✓ Đã hoàn thành' : 'Đang học')}</span>
        </div>
        <div class="ss-card-body">
          ${!STATE.progress.step1 ? `
            <div class="ss-locked-notice">
              <i class="fas fa-lock"></i>
              <span>Vui lòng hoàn thành <strong>Bước 1 (Mục tiêu bài học)</strong> để mở khóa phần này!</span>
            </div>
          ` : `
            <div class="ss-theory-concept">
              <h4><i class="fas fa-lightbulb" style="color:#f59e0b;"></i> ${lesson.step2.conceptTitle}</h4>
              <p>${lesson.step2.conceptBody}</p>
            </div>

            <div class="ss-shapes-grid">
              ${lesson.step2.shapes.map(s => `
                <div class="ss-shape-item" style="border-left: 4px solid ${s.color};">
                  <div class="ss-shape-name" style="color:${s.color};">${s.name}</div>
                  <div class="ss-shape-meaning">${s.meaning}</div>
                </div>
              `).join('')}
            </div>

            <div class="ss-example-box">
              <h4><i class="fas fa-tasks" style="color:#10b981;"></i> ${lesson.step2.exampleTitle}</h4>
              <ol class="ss-example-steps">
                ${lesson.step2.exampleSteps.map(st => `<li>${st}</li>`).join('')}
              </ol>
            </div>
          `}
        </div>
        ${STATE.progress.step1 ? `
          <div class="ss-card-footer">
            <button type="button" class="ss-btn ss-btn-primary ${STATE.progress.step2 ? 'ss-btn-done' : ''}" id="btn-confirm-step2">
              <i class="fas ${STATE.progress.step2 ? 'fa-check-double' : 'fa-arrow-right'}"></i> 
              ${STATE.progress.step2 ? '✓ Đã nắm vững lý thuyết' : lesson.step2.btnConfirm}
            </button>
          </div>
        ` : ''}
      </section>

      <!-- KHỐI 3: EM GHI VÀO VỞ HỌC (CALLOUT BOX VÀNG NỔI BẬT) -->
      <section class="cvalms-selfstudy-card ${!STATE.progress.step2 ? 'is-locked' : (STATE.progress.step3 ? 'is-completed' : 'is-active')}" id="ss-card-step3">
        <div class="ss-card-header">
          <div class="ss-card-badge" style="background:#f59e0b;color:#0f172a;"><i class="fas fa-pen-fancy"></i> BƯỚC 3</div>
          <h3 class="ss-card-title">${lesson.step3.title}</h3>
          <span class="ss-status-pill">${!STATE.progress.step2 ? '🔒 Đang khóa' : (STATE.progress.step3 ? '✓ Đã ghi vở' : 'Cần ghi vở')}</span>
        </div>
        <div class="ss-card-body">
          ${!STATE.progress.step2 ? `
            <div class="ss-locked-notice">
              <i class="fas fa-lock"></i>
              <span>Vui lòng hoàn thành <strong>Bước 2 (Lý thuyết)</strong> để mở khóa phần ghi vở!</span>
            </div>
          ` : `
            <div class="ss-notebook-callout">
              <div class="ss-notebook-tag"><i class="fas fa-book"></i> ${lesson.step3.badge}</div>
              <p class="ss-notebook-sub"><i class="fas fa-hand-point-right"></i> Em hãy dừng lại 2 phút, chắt lọc và ghi chép cẩn thận 3 mục cốt lõi này vào vở ghi Tin học của mình:</p>
              <div class="ss-notebook-lines">
                ${lesson.step3.contentLines.map(l => `<div class="ss-notebook-line">${l}</div>`).join('')}
              </div>
            </div>
          `}
        </div>
        ${STATE.progress.step2 ? `
          <div class="ss-card-footer">
            <button type="button" class="ss-btn ss-btn-warning ${STATE.progress.step3 ? 'ss-btn-done' : ''}" id="btn-confirm-step3">
              <i class="fas ${STATE.progress.step3 ? 'fa-check-double' : 'fa-check'}"></i> 
              ${STATE.progress.step3 ? '✓ Đã ghi xong bài vào vở' : lesson.step3.btnConfirm}
            </button>
          </div>
        ` : ''}
      </section>

      <!-- KHỐI 4: THỬ THÁCH LUYỆN TẬP TƯƠNG TÁC -->
      <section class="cvalms-selfstudy-card ${!STATE.progress.step3 ? 'is-locked' : (STATE.progress.completed ? 'is-completed' : 'is-active')}" id="ss-card-step4">
        <div class="ss-card-header">
          <div class="ss-card-badge" style="background:#a855f7;color:#ffffff;"><i class="fas fa-award"></i> BƯỚC 4</div>
          <h3 class="ss-card-title">${lesson.step4.title}</h3>
          <span class="ss-status-pill">${!STATE.progress.step3 ? '🔒 Đang khóa' : (STATE.progress.completed ? '🏆 Xuất sắc 100%' : 'Luyện tập')}</span>
        </div>
        <div class="ss-card-body">
          ${!STATE.progress.step3 ? `
            <div class="ss-locked-notice">
              <i class="fas fa-lock"></i>
              <span>Vui lòng hoàn thành <strong>Bước 3 (Ghi vở)</strong> để mở khóa thử thách luyện tập!</span>
            </div>
          ` : `
            <!-- PHẦN 4.1: ĐIỀN TỪ KHUYẾT -->
            <div class="ss-practice-box" id="ss-cloze-box">
              <h4><i class="fas fa-spell-check" style="color:#38bdf8;"></i> Thử thách 1: Điền từ vào chỗ trống</h4>
              <div class="ss-cloze-sentence">
                <span>${lesson.step4.cloze.questionText}</span>
                <span class="ss-cloze-blank" id="cloze-selected-blank">${lesson.step4.cloze.blankPlaceholder}</span>
                <span>${lesson.step4.cloze.afterText}</span>
              </div>
              <div class="ss-cloze-chips" id="cloze-chips-container">
                <span class="ss-chips-label"><i class="fas fa-mouse-pointer"></i> Bấm chọn 1 từ đúng dưới đây:</span>
                <div class="ss-chips-list">
                  ${lesson.step4.cloze.options.map(opt => `
                    <button type="button" class="ss-chip-btn" data-val="${opt}" onclick="window.CVALMS_SELF_STUDY.handleSelectCloze('${opt}')">
                      ${opt}
                    </button>
                  `).join('')}
                </div>
              </div>
              <div class="ss-feedback-msg" id="cloze-feedback"></div>
            </div>

            <!-- PHẦN 4.2: TRẮC NGHIỆM CHỌN PHƯƠNG ÁN -->
            <div class="ss-practice-box" id="ss-quiz-box" style="margin-top:20px;">
              <h4><i class="fas fa-question-circle" style="color:#10b981;"></i> Thử thách 2: Trắc nghiệm củng cố</h4>
              <p class="ss-quiz-question">${lesson.step4.quiz.question}</p>
              <div class="ss-quiz-options-grid">
                ${lesson.step4.quiz.options.map((opt, idx) => `
                  <button type="button" class="ss-quiz-opt-btn" data-idx="${idx}" onclick="window.CVALMS_SELF_STUDY.handleSelectQuiz(${idx})">
                    ${opt}
                  </button>
                `).join('')}
              </div>
              <div class="ss-feedback-msg" id="quiz-feedback"></div>
            </div>

            <!-- MÀN HÌNH HOÀN THÀNH BÀI HỌC -->
            <div class="ss-mastery-banner" id="ss-mastery-banner" style="${STATE.progress.completed ? 'display:flex;' : 'display:none;'}">
              <div class="ss-mastery-icon"><i class="fas fa-trophy"></i></div>
              <div class="ss-mastery-text">
                <h3>XUẤT SẮC! EM ĐÃ HOÀN THÀNH 100% TIẾN ĐỘ BÀI HỌC!</h3>
                <p>Toàn bộ kiến thức bài học đã được ghi nhận vào hệ thống phòng máy. Hãy sẵn sàng tham gia thử thách thi đua trên Sân khấu của Thầy/Cô!</p>
              </div>
            </div>
          `}
        </div>
      </section>
    `);

    bindStepButtons();
  }

  function bindStepButtons() {
    // Bước 1
    const b1 = document.getElementById('btn-confirm-step1');
    if (b1) {
      b1.onclick = () => {
        STATE.progress.step1 = true;
        saveProgress(STATE.currentLessonId, STATE.progress);
        renderSelfStudyView(STATE.currentLessonId);
        triggerSound('ting');
      };
    }

    // Bước 2
    const b2 = document.getElementById('btn-confirm-step2');
    if (b2) {
      b2.onclick = () => {
        STATE.progress.step2 = true;
        saveProgress(STATE.currentLessonId, STATE.progress);
        renderSelfStudyView(STATE.currentLessonId);
        triggerSound('ting');
      };
    }

    // Bước 3
    const b3 = document.getElementById('btn-confirm-step3');
    if (b3) {
      b3.onclick = () => {
        STATE.progress.step3 = true;
        saveProgress(STATE.currentLessonId, STATE.progress);
        renderSelfStudyView(STATE.currentLessonId);
        triggerSound('ting');
      };
    }
  }

  function updateTopProgress(title, percent) {
    const titleEl = document.getElementById('ss-header-lesson-title');
    const percentEl = document.getElementById('ss-progress-percent-label');
    const fillEl = document.getElementById('ss-progress-bar-fill');

    if (titleEl) titleEl.textContent = title;
    if (percentEl) percentEl.textContent = `${percent}% Hoàn thành`;
    if (fillEl) fillEl.style.width = `${percent}%`;
  }

  function updateSidebarActive(activeId) {
    const items = document.querySelectorAll('.ss-sidebar-item');
    items.forEach(it => {
      const lid = it.getAttribute('data-id');
      if (lid === activeId) {
        it.classList.add('active');
      } else {
        it.classList.remove('active');
      }
      // Cập nhật % trên sidebar
      const pr = loadProgress(lid);
      const pct = calculatePercent(pr);
      const badge = it.querySelector('.ss-item-badge');
      if (badge) {
        badge.textContent = `${pct}%`;
        if (pct === 100) {
          badge.classList.add('badge-mastered');
          badge.innerHTML = sanitizeHTML('<i class="fas fa-check"></i> 100%');
        }
      }
    });
  }

  function renderSidebarList() {
    const listEl = document.getElementById('ss-sidebar-lesson-list');
    if (!listEl) return;

    listEl.innerHTML = sanitizeHTML(Object.values(LESSONS_DB).map(les => {
      const pr = loadProgress(les.id);
      const pct = calculatePercent(pr);
      const isMastered = pct === 100;
      return `
        <div class="ss-sidebar-item ${les.id === STATE.currentLessonId ? 'active' : ''}" data-id="${les.id}" onclick="window.CVALMS_SELF_STUDY.switchLesson('${les.id}')">
          <div class="ss-item-icon">
            <i class="fas ${isMastered ? 'fa-check-circle' : 'fa-book'}"></i>
          </div>
          <div class="ss-item-info">
            <div class="ss-item-title">${les.title}</div>
            <div class="ss-item-meta">Khối ${les.grade} • ${les.duration}</div>
          </div>
          <div class="ss-item-badge ${isMastered ? 'badge-mastered' : ''}">
            ${isMastered ? '<i class="fas fa-check"></i> 100%' : `${pct}%`}
          </div>
        </div>
      `;
    }).join(''));
  }

  function triggerSound(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'ting') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'fanfare') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      // Bỏ qua nếu audio context bị khóa
    }
  }

  function triggerConfetti() {
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }

  // 4. PUBLIC API CHO GIAO DIỆN
  window.CVALMS_SELF_STUDY = {
    init: function () {
      renderSidebarList();
      renderSelfStudyView(STATE.currentLessonId);
    },

    open: function () {
      // Ẩn tất cả các màn hình lớn khác
      document.querySelectorAll('.app-screen').forEach(scr => {
        scr.classList.remove('active');
        scr.style.display = 'none';
      });

      const ssScreen = document.getElementById('screen-self-study');
      if (ssScreen) {
        ssScreen.classList.add('active');
        ssScreen.style.display = 'flex';
        this.init();
      }
    },

    backToLobby: function () {
      const ssScreen = document.getElementById('screen-self-study');
      if (ssScreen) {
        ssScreen.classList.remove('active');
        ssScreen.style.display = 'none';
      }

      const lobby = document.getElementById('screen-lobby');
      if (lobby) {
        lobby.classList.add('active');
        lobby.style.display = 'flex';
      }
    },

    switchLesson: function (lessonId) {
      if (LESSONS_DB[lessonId]) {
        renderSelfStudyView(lessonId);
      }
    },

    handleSelectCloze: function (chosenWord) {
      const lesson = LESSONS_DB[STATE.currentLessonId];
      if (!lesson) return;

      const blankEl = document.getElementById('cloze-selected-blank');
      const feedbackEl = document.getElementById('cloze-feedback');

      if (blankEl) {
        blankEl.textContent = chosenWord;
        blankEl.classList.add('has-value');
      }

      if (chosenWord === lesson.step4.cloze.correct) {
        STATE.progress.clozeDone = true;
        if (blankEl) {
          blankEl.style.borderColor = '#10b981';
          blankEl.style.color = '#10b981';
          blankEl.style.background = 'rgba(16, 185, 129, 0.15)';
        }
        if (feedbackEl) {
          feedbackEl.innerHTML = sanitizeHTML(`<span style="color:#10b981;"><i class="fas fa-check-circle"></i> ${lesson.step4.cloze.explanation}</span>`);
        }
        triggerSound('ting');
        this.checkOverallMastery();
      } else {
        STATE.progress.clozeDone = false;
        if (blankEl) {
          blankEl.style.borderColor = '#ef4444';
          blankEl.style.color = '#ef4444';
          blankEl.style.background = 'rgba(239, 68, 68, 0.15)';
        }
        if (feedbackEl) {
          feedbackEl.innerHTML = sanitizeHTML(`<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Chưa chính xác. Em hãy đọc lại khái niệm ở Bước 2 để chọn lại từ đúng nhé!</span>`);
        }
      }

      saveProgress(STATE.currentLessonId, STATE.progress);
      updateTopProgress(lesson.title, calculatePercent(STATE.progress));
    },

    handleSelectQuiz: function (optIdx) {
      const lesson = LESSONS_DB[STATE.currentLessonId];
      if (!lesson) return;

      const btns = document.querySelectorAll('.ss-quiz-opt-btn');
      const feedbackEl = document.getElementById('quiz-feedback');

      btns.forEach((b, i) => {
        b.classList.remove('selected-correct', 'selected-wrong');
        if (i === optIdx) {
          if (optIdx === lesson.step4.quiz.correctIndex) {
            b.classList.add('selected-correct');
          } else {
            b.classList.add('selected-wrong');
          }
        }
      });

      if (optIdx === lesson.step4.quiz.correctIndex) {
        STATE.progress.quizDone = true;
        if (feedbackEl) {
          feedbackEl.innerHTML = sanitizeHTML(`<span style="color:#10b981;"><i class="fas fa-check-circle"></i> ${lesson.step4.quiz.explanation}</span>`);
        }
        triggerSound('ting');
        this.checkOverallMastery();
      } else {
        STATE.progress.quizDone = false;
        if (feedbackEl) {
          feedbackEl.innerHTML = sanitizeHTML(`<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Chưa chính xác. Em hãy xem lại bảng các hình quy ước ở Bước 2 nhé!</span>`);
        }
      }

      saveProgress(STATE.currentLessonId, STATE.progress);
      updateTopProgress(lesson.title, calculatePercent(STATE.progress));
    },

    checkOverallMastery: function () {
      if (STATE.progress.step1 && STATE.progress.step2 && STATE.progress.step3 && STATE.progress.clozeDone && STATE.progress.quizDone) {
        STATE.progress.completed = true;
        saveProgress(STATE.currentLessonId, STATE.progress);
        updateTopProgress(LESSONS_DB[STATE.currentLessonId].title, 100);
        updateSidebarActive(STATE.currentLessonId);

        const banner = document.getElementById('ss-mastery-banner');
        if (banner) banner.style.display = 'flex';

        triggerSound('fanfare');
        triggerConfetti();

        // Gửi thông điệp thời gian thực lên Gateway nếu có kết nối
        if (typeof window.LIVE_MONITOR !== 'undefined' && typeof window.LIVE_MONITOR.sendGatewayMessage === 'function') {
          window.LIVE_MONITOR.sendGatewayMessage({
            type: 'LMS_SELFSTUDY_COMPLETE',
            lessonId: STATE.currentLessonId,
            timestamp: Date.now()
          });
        }
      }
    }
  };

  // Tự động khởi tạo khi tài liệu sẵn sàng
  document.addEventListener('DOMContentLoaded', function () {
    // Gắn sự kiện nút mở tự học ở sảnh nếu có
    const btnLobby = document.getElementById('btn-enter-self-study');
    if (btnLobby) {
      btnLobby.onclick = () => {
        window.location.href = 'self_study.html';
      };
    }
  });

})();
