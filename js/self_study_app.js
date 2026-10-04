/**
 * CVALMS EDTECH PRO - CLIENT INTERFACE & EXPERIENCE ENGINE
 * Orchestrates Curriculum, Stepper, YouTube Embeds, Images, Anti-Skipping & Teacher PIN Gate
 */

const sanitizeHTML = (h) => {
  if (typeof SelfStudyMedia !== 'undefined' && typeof SelfStudyMedia.sanitizeMediaContent === 'function') {
    return SelfStudyMedia.sanitizeMediaContent(h);
  }
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(h, {
      ADD_TAGS: ['iframe', 'video', 'source'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'referrerpolicy', 'controls', 'controlslist', 'preload']
    });
  }
  return h;
};

// Audio Synthesis Engine (Zero dependencies, pure Web Audio API)
function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.22);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'celebrate') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.08, now + idx * 0.09);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
        o.start(now + idx * 0.09);
        o.stop(now + idx * 0.09 + 0.35);
      });
    }
  } catch (e) {
    /* Audio context autoplay restriction handled */
  }
}

// Toast System
function showToast(msg, icon = 'fa-check') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = sanitizeHTML(`<i class="fa-solid ${icon}" style="color: var(--accent-cyan);"></i><span>${msg}</span>`);
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.3s ease';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// Particle Confetti Burst
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#38bdf8', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#ffffff'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.35,
      r: Math.random() * 6 + 3,
      dx: (Math.random() - 0.5) * 14,
      dy: (Math.random() - 0.7) * 14,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10,
      tiltSpeed: Math.random() * 0.1 + 0.05,
      life: 1
    });
  }

  let animationFrame;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.35; // gravity
      p.life -= 0.012;
      p.tilt += p.tiltSpeed;
      if (p.life > 0) {
        alive = true;
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }
  render();
}

// YouTube Video Embed Extractor & Renderer
function parseYouTubeId(url) {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:.*v(?:ersion)?\/|.*(?:[?&]v=)|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function renderMediaMarkup(media) {
  if (!media || media.type === 'none' || !media.url) {
    return '';
  }

  if (typeof SelfStudyMedia !== 'undefined' && typeof SelfStudyMedia.renderMediaHtml === 'function') {
    return SelfStudyMedia.renderMediaHtml(media);
  }

  const ytId = parseYouTubeId(media.url);
  if (ytId) {
    return `
      <div class="video-theater-wrapper">
        <div class="video-aspect-ratio">
          <iframe 
            src="https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1" 
            title="${media.caption || 'Video bài giảng'}" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" 
            allowfullscreen>
          </iframe>
        </div>
        <div class="media-caption-bar">
          <div><i class="fa-solid fa-video" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${media.caption || 'Video bài giảng trực quan'}</div>
          <span class="hd-badge">YOUTUBE HD</span>
        </div>
      </div>
    `;
  }

  if (media.type === 'video') {
    return `
      <div class="video-theater-wrapper">
        <video src="${media.url}" controls controlsList="nodownload" preload="metadata" style="width: 100%; height: 100%; border: none;"></video>
        <div class="media-caption-bar">
          <div><i class="fa-solid fa-video" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${media.caption || 'Video bài giảng trực quan'}</div>
          <span class="hd-badge">MP4 VIDEO</span>
        </div>
      </div>
    `;
  }

  if (media.type === 'image') {
    return `
      <div style="margin-bottom: 20px; text-align: center;">
        <img src="${media.url}" alt="${media.caption || 'Hình minh họa'}" style="max-width: 100%; border-radius: var(--radius-lg); border: 1px solid var(--border-card); box-shadow: var(--shadow-lg);">
        <div class="media-caption-bar" style="border-radius: 0 0 var(--radius-lg) var(--radius-lg); margin-top: -6px;">
          <div><i class="fa-solid fa-image" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${media.caption || 'Hình minh họa SGK'}</div>
        </div>
      </div>
    `;
  }

  return '';
}

// Engine and Editor Instantiation
const engine = new SelfStudyEngine({
  deskId: (typeof localStorage !== 'undefined' && localStorage.getItem('cvalms_desk_id')) || 'MAY-01',
  studentName: (typeof localStorage !== 'undefined' && localStorage.getItem('cvalms_student_name')) || 'Học sinh',
  minDwellTime: 25 // 25 seconds minimum engagement
});
const editor = new SelfStudyEditor();

let manifestData = null;
let currentGrade = '6';
let currentActiveStage = 1;
let currentXp = 150;
let dwellInterval = null;

// Setup Badges
const deskIdText = document.getElementById('deskIdText');
const studentNameText = document.getElementById('studentNameText');
if (deskIdText) deskIdText.textContent = engine.deskId;
if (studentNameText) studentNameText.textContent = engine.studentName;

// Theme Controller (Dark / Light)
const btnToggleTheme = document.getElementById('btnToggleTheme');
const themeIcon = document.getElementById('themeIcon');
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeIcon) {
    themeIcon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cvalms_theme', theme);
  }
}

const savedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('cvalms_theme')) || 'dark';
applyTheme(savedTheme);

if (btnToggleTheme) {
  btnToggleTheme.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    applyTheme(isLight ? 'dark' : 'light');
    showToast(isLight ? 'Đã bật chế độ Tối' : 'Đã bật chế độ Sáng', isLight ? 'fa-moon' : 'fa-sun');
  });
}

// Fullscreen Controller
const btnFullscreen = document.getElementById('btnFullscreen');
if (btnFullscreen) {
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// --- TEACHER AUTHENTICATION & PIN GATEKEEPER ---
const TEACHER_PIN_DEFAULT = 'cvalms2026';
const teacherAuthModal = document.getElementById('teacherAuthModal');
const teacherPinInput = document.getElementById('teacherPinInput');
const pinErrorMsg = document.getElementById('pinErrorMsg');
const btnCancelAuthPin = document.getElementById('btnCancelAuthPin');
const btnConfirmAuthPin = document.getElementById('btnConfirmAuthPin');

function isTeacherAuthed() {
  return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cvalms_teacher_authed') === 'true';
}

function openTeacherAuthModal() {
  if (teacherAuthModal) {
    teacherAuthModal.style.display = 'flex';
    if (teacherPinInput) {
      teacherPinInput.value = '';
      teacherPinInput.classList.remove('shake');
      teacherPinInput.focus();
    }
    if (pinErrorMsg) pinErrorMsg.style.display = 'none';
  }
}

function closeTeacherAuthModal() {
  if (teacherAuthModal) teacherAuthModal.style.display = 'none';
}

if (btnCancelAuthPin) {
  btnCancelAuthPin.addEventListener('click', closeTeacherAuthModal);
}

function verifyAndEnterStudio() {
  const entered = teacherPinInput ? teacherPinInput.value.trim() : '';
  if (entered === TEACHER_PIN_DEFAULT) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cvalms_teacher_authed', 'true');
    }
    closeTeacherAuthModal();
    isTeacherMode = true;
    updateModeDisplay();
    populateEditorForm(engine.currentLesson || editor.currentLesson);
    showToast('Xác thực thành công. Đã vào Studio Soạn bài!', 'fa-user-shield');
    playSound('correct');
  } else {
    if (pinErrorMsg) pinErrorMsg.style.display = 'block';
    if (teacherPinInput) {
      teacherPinInput.classList.add('shake');
      setTimeout(() => teacherPinInput.classList.remove('shake'), 500);
    }
    playSound('wrong');
  }
}

if (btnConfirmAuthPin) {
  btnConfirmAuthPin.addEventListener('click', verifyAndEnterStudio);
}

if (teacherPinInput) {
  teacherPinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyAndEnterStudio();
    if (e.key === 'Escape') closeTeacherAuthModal();
  });
}

// Secret Trigger: Click brand logo 3 times in 2s to open Teacher Modal
let logoClickCount = 0;
let logoClickTimer = null;
const brandLogo = document.getElementById('brandLogo');
if (brandLogo) {
  brandLogo.addEventListener('click', (e) => {
    logoClickCount++;
    if (logoClickCount === 1) {
      logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);
    } else if (logoClickCount >= 3) {
      e.preventDefault();
      clearTimeout(logoClickTimer);
      logoClickCount = 0;
      openTeacherAuthModal();
    }
  });
}

// Shortcut: Ctrl + Shift + F12
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'F12') {
    e.preventDefault();
    openTeacherAuthModal();
  }
});

// Teacher / Student Mode Switching
const urlSearchRole = new URLSearchParams(window.location.search).get('role');
if (urlSearchRole === 'teacher') {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('cvalms_teacher_authed', 'true');
  }
}
let isTeacherMode = (urlSearchRole === 'teacher') || isTeacherAuthed();

function updateModeDisplay() {
  const studentWorkspace = document.getElementById('studentWorkspace');
  const teacherWorkspace = document.getElementById('teacherWorkspace');
  const sidebar = document.getElementById('sidebar');
  const studioBtnText = document.getElementById('studioBtnText');
  const studioLockIcon = document.getElementById('studioLockIcon');

  if (isTeacherMode) {
    if (studentWorkspace) studentWorkspace.style.display = 'none';
    if (teacherWorkspace) teacherWorkspace.style.display = 'block';
    if (sidebar) sidebar.style.display = 'none';
    if (studioBtnText) studioBtnText.textContent = 'Học sinh';
    if (studioLockIcon) studioLockIcon.className = 'fa-solid fa-graduation-cap';
  } else {
    if (studentWorkspace) studentWorkspace.style.display = 'block';
    if (teacherWorkspace) teacherWorkspace.style.display = 'none';
    if (sidebar) sidebar.style.display = 'flex';
    if (studioBtnText) studioBtnText.textContent = 'Soạn bài giảng';
    if (studioLockIcon) studioLockIcon.className = 'fa-solid fa-lock';
  }
}

const btnToggleStudio = document.getElementById('btnToggleStudio');
if (btnToggleStudio) {
  btnToggleStudio.addEventListener('click', () => {
    if (isTeacherMode) {
      isTeacherMode = false;
      updateModeDisplay();
      showToast('Đã về Chế độ Học sinh', 'fa-graduation-cap');
    } else {
      if (isTeacherAuthed()) {
        isTeacherMode = true;
        updateModeDisplay();
        populateEditorForm(engine.currentLesson || editor.currentLesson);
        showToast('Đã mở Studio Soạn bài', 'fa-pen-ruler');
      } else {
        openTeacherAuthModal();
      }
    }
  });
}

const btnSwitchPreview = document.getElementById('btnSwitchToStudentPreview');
if (btnSwitchPreview) {
  btnSwitchPreview.addEventListener('click', () => {
    saveFormToEditor();
    engine.loadLesson(editor.currentLesson);
    isTeacherMode = false;
    updateModeDisplay();
    renderStudentLesson();
    switchStage(1);
    showToast('Đang xem thử bài học', 'fa-eye');
  });
}

// Stepper Tab Switching
window.switchStage = function(stageNum) {
  if (!engine.canAccessStep(stageNum)) {
    showToast('Vui lòng hoàn thành các bước trước đó', 'fa-lock');
    return;
  }
  currentActiveStage = stageNum;

  for (let s = 1; s <= 4; s++) {
    const stageEl = document.getElementById(`stageStep${s}`);
    const tabBtn = document.getElementById(`tabStep${s}`);
    if (stageEl) {
      stageEl.style.display = s === stageNum ? 'flex' : 'none';
    }
    if (tabBtn) {
      if (s === stageNum) tabBtn.classList.add('active');
      else tabBtn.classList.remove('active');
    }
  }

  // Handle Step 2 Dwell Time Monitoring
  if (stageNum === 2) {
    startStep2DwellTimer();
  } else {
    stopStep2DwellTimer();
  }

  // Smooth scroll to top of workspace
  const ws = document.getElementById('studentWorkspace');
  if (ws) ws.scrollTo({ top: 0, behavior: 'smooth' });
};

window.proceedToStep = function(nextStep) {
  const currentStep = nextStep - 1;
  engine.completeStep(currentStep);
  updateStepperState();
  switchStage(nextStep);
  playSound('correct');
  showToast(`Đã hoàn thành Bước ${currentStep}!`, 'fa-circle-check');
};

function updateStepperState() {
  const totalSteps = (engine.currentLesson && Array.isArray(engine.currentLesson.sections) && engine.currentLesson.sections.length > 0)
    ? engine.currentLesson.sections.length
    : 4;

  for (let s = 1; s <= totalSteps; s++) {
    const tabBtn = document.getElementById(`tabStep${s}`);
    const tabNum = document.getElementById(`tabNum${s}`);
    if (!tabBtn || !tabNum) continue;

    const canAccess = engine.canAccessStep(s);
    const isDone = engine.isStepCompleted(s);

    if (canAccess) {
      tabBtn.classList.remove('locked');
    } else {
      tabBtn.classList.add('locked');
    }

    if (isDone) {
      tabBtn.classList.add('completed');
      tabNum.innerHTML = sanitizeHTML('<i class="fa-solid fa-check"></i>');
    } else {
      tabBtn.classList.remove('completed');
      tabNum.textContent = s;
    }
  }

  // Calculate Progress Percent
  const completedCount = engine.completedSteps.size;
  const pct = Math.min(100, Math.round((completedCount / totalSteps) * 100));
  const pBar = document.getElementById('progressBar');
  const pPct = document.getElementById('progressPercent');
  if (pBar) pBar.style.width = `${pct}%`;
  if (pPct) pPct.textContent = `${pct}%`;
}

// Manifest & Lesson Loading (Robust Online / Offline Fallback)
async function loadManifest() {
  let loaded = false;
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('lessons/manifest.json');
      if (res.ok) {
        manifestData = await res.json();
        loaded = true;
      }
    } catch (e) {
      /* fetch blocked by network / gateway */
    }
  }

  if (!loaded || !manifestData) {
    if (typeof window.CVALMS_EMBEDDED_MANIFEST !== 'undefined') {
      manifestData = window.CVALMS_EMBEDDED_MANIFEST;
    }
  }

  renderGradeLessons(currentGrade);
}

// Grade Segmented Tabs
document.querySelectorAll('.grade-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentGrade = btn.dataset.grade;
    const bcGrade = document.getElementById('breadcrumbGrade');
    if (bcGrade) bcGrade.textContent = `Tin học ${currentGrade}`;
    renderGradeLessons(currentGrade);
  });
});

function renderGradeLessons(grade) {
  const listEl = document.getElementById('lessonList');
  if (!listEl) return;
  listEl.innerHTML = sanitizeHTML('');
  if (!manifestData) return;

  const group = manifestData.grades.find(g => String(g.grade) === String(grade));
  if (!group || !group.lessons.length) {
    listEl.innerHTML = sanitizeHTML('<div style="color: var(--text-muted); padding: 16px; font-size: 13px;">Chưa có bài học cho khối này.</div>');
    return;
  }

  group.lessons.forEach((l, idx) => {
    const item = document.createElement('div');
    item.className = 'lesson-card-item';
    item.id = `lessonCard_${l.id}`;
    item.innerHTML = sanitizeHTML(`
      <div class="lesson-card-icon">
        <i class="fa-solid fa-book"></i>
      </div>
      <div class="lesson-card-body">
        <div class="lesson-card-unit">${l.unit}</div>
        <div class="lesson-card-title">${l.title}</div>
        <div class="lesson-card-meta">
          <span><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${l.duration || '35 phút'}</span>
          <span class="lesson-pill-status" id="badge_${l.id}">Chưa học</span>
        </div>
      </div>
    `);

    item.addEventListener('click', () => {
      document.querySelectorAll('.lesson-card-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      loadLessonById(l.id, l.file);
    });

    listEl.appendChild(item);

    if (idx === 0) item.click();
  });
}

async function loadLessonById(id, file) {
  let lesson = null;
  if (window.location.protocol.startsWith('http') && file) {
    try {
      const res = await fetch(`lessons/${file}`);
      if (res.ok) {
        lesson = await res.json();
      }
    } catch (e) {
      /* fetch blocked by network / gateway */
    }
  }

  if (!lesson && typeof window.CVALMS_EMBEDDED_LESSONS !== 'undefined') {
    lesson = window.CVALMS_EMBEDDED_LESSONS[id];
  }

  if (lesson) {
    engine.loadLesson(lesson);
    editor.loadLesson(lesson);
    renderStudentLesson();
    switchStage(1);
    updateStepperState();
  }
}

// --- RENDER STUDENT LESSON ---
function renderStudentLesson() {
  const l = engine.currentLesson;
  if (!l) return;

  const uEl = document.getElementById('lessonUnit');
  const tEl = document.getElementById('lessonTitle');
  const dEl = document.getElementById('lessonDuration');
  if (uEl) uEl.textContent = l.unit;
  if (tEl) tEl.textContent = l.title;
  if (dEl) dEl.textContent = l.duration || '35 phút';

  // Render Bước 1: Mục tiêu có Interactive Checkbox
  renderStep1Objectives();

  // Render Bước 2: Media (YouTube / Video / Ảnh) & Lý thuyết
  const mediaBox = document.getElementById('mediaBox');
  if (mediaBox) {
    const mediaHtml = renderMediaMarkup(l.step2_theory?.media);
    if (mediaHtml) {
      mediaBox.style.display = 'block';
      mediaBox.innerHTML = sanitizeHTML(mediaHtml);
    } else {
      mediaBox.style.display = 'none';
      mediaBox.innerHTML = sanitizeHTML('');
    }
  }

  const s2Content = document.getElementById('step2Content');
  if (s2Content) {
    s2Content.innerHTML = sanitizeHTML((l.step2_theory?.sections || []).map(sec => `
      <h3>${sec.heading}</h3>
      <div>${engine.renderMarkdown(sec.content)}</div>
    `).join(''));
  }

  const infoGrid = document.getElementById('infographicGrid');
  if (infoGrid) {
    infoGrid.innerHTML = sanitizeHTML('');
    (l.step2_theory?.sections || []).forEach(sec => {
      (sec.infographicCards || []).forEach(card => {
        const c = document.createElement('div');
        c.className = 'infographic-card';
        c.style.borderLeftColor = card.color || 'var(--accent-cyan)';
        c.innerHTML = sanitizeHTML(`
          <div class="info-card-title">${card.title}</div>
          <div class="info-card-desc">${card.desc}</div>
        `);
        infoGrid.appendChild(c);
      });
    });
  }

  // Render Bước 3: Sổ tay ghi chép có Check-off tương tác
  renderStep3Notebook();

  // Render Bước 4: Luyện tập (Điền khuyết & Trắc nghiệm kèm ảnh)
  renderStep4Practice();
  updateStepperState();
}

// --- STEP 1: INTERACTIVE OBJECTIVES CHECKLIST ---
function renderStep1Objectives() {
  const l = engine.currentLesson;
  const s1List = document.getElementById('step1List');
  const objCheckCount = document.getElementById('objCheckCount');
  const objTotalCount = document.getElementById('objTotalCount');
  const btnNext = document.getElementById('btnCompleteStep1');
  const btnText = document.getElementById('btnTextStep1');
  const lockIcon = document.getElementById('lockIconStep1');

  if (!s1List || !l) return;
  const items = l.step1_objectives?.items || [];
  if (objTotalCount) objTotalCount.textContent = items.length;

  s1List.innerHTML = sanitizeHTML('');
  items.forEach((item, idx) => {
    const isChecked = engine.interactions.step1_checked.has(idx);
    const row = document.createElement('div');
    row.className = `obj-interactive-item ${isChecked ? 'checked' : ''}`;
    row.id = `obj_item_${idx}`;
    row.innerHTML = sanitizeHTML(`
      <div class="obj-checkbox-box">
        <i class="fa-solid fa-check"></i>
      </div>
      <div style="flex: 1; line-height: 1.5;">${item}</div>
    `);

    row.addEventListener('click', () => {
      const nowChecked = engine.toggleObjective(idx);
      if (nowChecked) row.classList.add('checked');
      else row.classList.remove('checked');
      updateStep1ProgressUI();
      playSound('correct');
    });

    s1List.appendChild(row);
  });

  updateStep1ProgressUI();
}

function updateStep1ProgressUI() {
  const l = engine.currentLesson;
  const items = l?.step1_objectives?.items || [];
  const objCheckCount = document.getElementById('objCheckCount');
  const btnNext = document.getElementById('btnCompleteStep1');
  const btnText = document.getElementById('btnTextStep1');
  const lockIcon = document.getElementById('lockIconStep1');

  const checkedCount = engine.interactions.step1_checked.size;
  if (objCheckCount) objCheckCount.textContent = checkedCount;

  const isReady = engine.isStep1Ready();
  if (btnNext) {
    if (isReady) {
      btnNext.disabled = false;
      if (btnText) btnText.textContent = 'Đã nắm rõ mục tiêu • Chuyển sang xem bài giảng';
      if (lockIcon) lockIcon.className = 'fa-solid fa-arrow-right';
    } else {
      btnNext.disabled = true;
      if (btnText) btnText.textContent = `Vui lòng tích chọn đủ ${items.length} mục tiêu để tiếp tục`;
      if (lockIcon) lockIcon.className = 'fa-solid fa-lock';
    }
  }
}

// --- STEP 2: DWELL-TIME COUNTDOWN TIMER ---
function startStep2DwellTimer() {
  stopStep2DwellTimer();
  updateStep2DwellUI();

  if (engine.isStep2Ready()) return;

  dwellInterval = setInterval(() => {
    engine.tickDwellTime(1);
    updateStep2DwellUI();
    if (engine.isStep2Ready()) {
      stopStep2DwellTimer();
      playSound('correct');
      showToast('Đã hoàn thành thời gian tìm hiểu. Em có thể sang Bước 3!', 'fa-circle-check');
    }
  }, 1000);
}

function stopStep2DwellTimer() {
  if (dwellInterval) {
    clearInterval(dwellInterval);
    dwellInterval = null;
  }
}

function updateStep2DwellUI() {
  const badge = document.getElementById('dwellTimerBadge');
  const badgeText = document.getElementById('dwellTimerText');
  const btnNext = document.getElementById('btnCompleteStep2');
  const btnText = document.getElementById('btnTextStep2');
  const lockIcon = document.getElementById('lockIconStep2');

  const elapsed = engine.interactions.step2_dwellElapsed;
  const total = engine.minDwellTime;
  const remaining = Math.max(0, total - elapsed);
  const isReady = engine.isStep2Ready();

  if (isReady) {
    if (badge) {
      badge.className = 'dwell-timer-tag ready';
      if (badgeText) badgeText.innerHTML = sanitizeHTML('<i class="fa-solid fa-check"></i> Đã hoàn thành thời gian tìm hiểu');
    }
    if (btnNext) {
      btnNext.disabled = false;
      if (btnText) btnText.textContent = 'Đã hoàn thành khám phá • Chuyển sang ghi vở';
      if (lockIcon) lockIcon.className = 'fa-solid fa-arrow-right';
    }
  } else {
    if (badge) {
      badge.className = 'dwell-timer-tag';
      if (badgeText) badgeText.innerHTML = sanitizeHTML(`<i class="fa-solid fa-hourglass-half fa-spin"></i> Nghiên cứu bài học (còn ${remaining}s)...`);
    }
    if (btnNext) {
      btnNext.disabled = true;
      if (btnText) btnText.textContent = `Đang tìm hiểu nội dung (còn ${remaining}s)...`;
      if (lockIcon) lockIcon.className = 'fa-solid fa-hourglass-half';
    }
  }
}

// --- STEP 3: INTERACTIVE NOTEBOOK CHECK-OFF ---
function renderStep3Notebook() {
  const l = engine.currentLesson;
  const s3List = document.getElementById('step3List');
  const notesCheckCount = document.getElementById('notesCheckCount');
  const notesTotalCount = document.getElementById('notesTotalCount');

  if (!s3List || !l) return;
  const points = l.step3_notebook?.points || [];
  if (notesTotalCount) notesTotalCount.textContent = points.length;

  s3List.innerHTML = sanitizeHTML('');
  points.forEach((pt, idx) => {
    const isChecked = engine.interactions.step3_notesChecked.has(idx);
    const card = document.createElement('div');
    card.className = `notebook-interactive-card ${isChecked ? 'checked' : ''}`;
    card.id = `note_card_${idx}`;
    card.innerHTML = sanitizeHTML(`
      <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
        <i class="fa-solid fa-pen-fancy" style="color: var(--accent-amber); margin-top: 4px;"></i>
        <div>${pt}</div>
      </div>
      <div class="notebook-check-btn" id="note_btn_${idx}">
        <i class="fa-solid ${isChecked ? 'fa-check' : 'fa-pen'}"></i>
        <span>${isChecked ? 'Đã ghi xong' : 'Chép vào vở'}</span>
      </div>
    `);

    card.addEventListener('click', () => {
      const nowChecked = engine.toggleNotebook(idx);
      if (nowChecked) card.classList.add('checked');
      else card.classList.remove('checked');
      const btnEl = document.getElementById(`note_btn_${idx}`);
      if (btnEl) {
        btnEl.innerHTML = sanitizeHTML(nowChecked ? '<i class="fa-solid fa-check"></i> <span>Đã ghi xong</span>' : '<i class="fa-solid fa-pen"></i> <span>Chép vào vở</span>');
      }
      updateStep3ProgressUI();
      playSound('correct');
    });

    s3List.appendChild(card);
  });

  updateStep3ProgressUI();
}

function updateStep3ProgressUI() {
  const l = engine.currentLesson;
  const points = l?.step3_notebook?.points || [];
  const notesCheckCount = document.getElementById('notesCheckCount');
  const btnNext = document.getElementById('btnCompleteStep3');
  const btnText = document.getElementById('btnTextStep3');
  const lockIcon = document.getElementById('lockIconStep3');

  const checkedCount = engine.interactions.step3_notesChecked.size;
  if (notesCheckCount) notesCheckCount.textContent = checkedCount;

  const isReady = engine.isStep3Ready();
  if (btnNext) {
    if (isReady) {
      btnNext.disabled = false;
      if (btnText) btnText.textContent = 'Đã ghi xong bài • Bắt đầu thử thách luyện tập';
      if (lockIcon) lockIcon.className = 'fa-solid fa-arrow-right';
    } else {
      btnNext.disabled = true;
      if (btnText) btnText.textContent = `Vui lòng xác nhận đã chép đủ ${points.length} ý vào vở`;
      if (lockIcon) lockIcon.className = 'fa-solid fa-lock';
    }
  }
}

// --- STEP 4: PRACTICE (CLOZE & QUIZZES WITH IMAGES) ---
function renderStep4Practice() {
  const l = engine.currentLesson;
  const clozeContainer = document.getElementById('clozeContainer');
  const quizzesContainer = document.getElementById('quizzesContainer');
  if (clozeContainer) clozeContainer.innerHTML = sanitizeHTML('');
  if (quizzesContainer) quizzesContainer.innerHTML = sanitizeHTML('');

  // Challenge 1: Điền khuyết
  if (clozeContainer && l.step4_practice?.cloze) {
    const cl = l.step4_practice.cloze;
    const box = document.createElement('div');
    box.className = 'challenge-box';
    const targetWord = engine.userAnswers.cloze ? engine.userAnswers.cloze.answer : '... (Bấm chọn từ bên dưới) ...';
    box.innerHTML = sanitizeHTML(`
      <div class="challenge-heading">
        <i class="fa-solid fa-puzzle-piece"></i>
        <span>Thử thách 1: Điền từ còn thiếu vào ô trống</span>
      </div>
      <div class="cloze-challenge-area">
        <div class="cloze-sentence-display">
          ${cl.text} <span id="clozeTarget" class="cloze-target-slot">${targetWord}</span>
        </div>
        <div class="cloze-chips-row">
          ${(cl.options || []).map(opt => `
            <button class="cloze-chip-btn" onclick="handleClozeClick('${opt.replace(/'/g, "\'")}')">
              <i class="fa-solid fa-tag" style="font-size: 11px; margin-right: 6px; opacity: 0.7;"></i>
              ${opt}
            </button>
          `).join('')}
        </div>
        <div id="clozeFeedback" class="feedback-alert-box" style="display: none;"></div>
      </div>
    `);
    clozeContainer.appendChild(box);
  }

  // Challenge 2: Trắc nghiệm (Hỗ trợ hình ảnh minh họa cho câu hỏi)
  if (quizzesContainer && l.step4_practice?.quizzes) {
    l.step4_practice.quizzes.forEach((q, qIdx) => {
      const qBox = document.createElement('div');
      qBox.className = 'quiz-card-box';
      const letters = ['A', 'B', 'C', 'D'];

      const imgHtml = q.image ? `
        <div class="quiz-illustration-wrap">
          <img src="${q.image}" class="quiz-illustrate-img" alt="Hình minh họa câu hỏi ${qIdx + 1}" loading="lazy">
        </div>
      ` : '';

      qBox.innerHTML = sanitizeHTML(`
        <div class="quiz-question-text">
          <span style="color: var(--accent-cyan); margin-right: 8px;">Câu ${qIdx + 1}:</span>
          ${q.question}
        </div>
        ${imgHtml}
        <div class="quiz-options-grid">
          ${q.options.map((opt, optIdx) => `
            <button class="quiz-option-button" id="q_${qIdx}_opt_${optIdx}" onclick="handleQuizClick(${qIdx}, ${optIdx})">
              <span style="font-weight: 800; color: var(--accent-cyan);">${letters[optIdx]}.</span>
              <span>${opt.replace(/^[A-D]\.\s*/, '')}</span>
            </button>
          `).join('')}
        </div>
        <div id="quizFeedback_${qIdx}" class="feedback-alert-box" style="display: none;"></div>
      `);
      quizzesContainer.appendChild(qBox);
    });
  }

  // Reset celebration banner
  const scoreBanner = document.getElementById('scoreBanner');
  if (scoreBanner) scoreBanner.style.display = 'none';
}

window.handleClozeClick = function(word) {
  const res = engine.evaluateCloze(word);
  const target = document.getElementById('clozeTarget');
  if (target) target.textContent = word;
  const fb = document.getElementById('clozeFeedback');
  if (fb) {
    fb.style.display = 'block';
    if (res.isCorrect) {
      fb.className = 'feedback-alert-box success';
      fb.innerHTML = sanitizeHTML(`<i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i> Chính xác! ${res.explanation}`);
      playSound('correct');
    } else {
      fb.className = 'feedback-alert-box error';
      fb.innerHTML = sanitizeHTML('<i class="fa-solid fa-circle-xmark" style="margin-right: 6px;"></i> Lựa chọn chưa đúng. Em hãy xem lại định nghĩa ở Bước 2 nhé!');
      playSound('wrong');
    }
  }
  checkAssessmentComplete();
};

window.handleQuizClick = function(qIdx, optIdx) {
  const res = engine.evaluateQuiz(qIdx, optIdx);
  const q = engine.currentLesson.step4_practice.quizzes[qIdx];
  q.options.forEach((_, i) => {
    const btn = document.getElementById(`q_${qIdx}_opt_${i}`);
    if (btn) {
      btn.classList.remove('correct', 'wrong');
      if (i === q.correctIndex) btn.classList.add('correct');
      else if (i === optIdx && !res.isCorrect) btn.classList.add('wrong');
    }
  });

  const fb = document.getElementById(`quizFeedback_${qIdx}`);
  if (fb) {
    fb.style.display = 'block';
    if (res.isCorrect) {
      fb.className = 'feedback-alert-box success';
      fb.innerHTML = sanitizeHTML(`<i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i> ${res.explanation}`);
      playSound('correct');
    } else {
      fb.className = 'feedback-alert-box error';
      fb.innerHTML = sanitizeHTML(`<i class="fa-solid fa-circle-xmark" style="margin-right: 6px;"></i> Chưa chính xác. ${res.explanation}`);
      playSound('wrong');
    }
  }
  checkAssessmentComplete();
};

function checkAssessmentComplete() {
  const score = engine.calculateScore();
  if (score.passed) {
    engine.completeStep(4);
    updateStepperState();

    const banner = document.getElementById('scoreBanner');
    if (banner) {
      banner.style.display = 'flex';
      banner.scrollIntoView({ behavior: 'smooth' });
    }
    const title = document.getElementById('scoreTitle');
    const detail = document.getElementById('scoreDetail');
    if (title) title.textContent = 'Xuất Sắc! Em Đã Làm Chủ Bài Học Đạt Chuẩn!';
    if (detail) {
      detail.textContent = `Kết quả: ${score.formattedScore} câu đúng (${score.percent}%). Em được cộng +50 XP!`;
    }

    currentXp += 50;
    const xpCount = document.getElementById('xpCount');
    if (xpCount) xpCount.textContent = `${currentXp} XP`;

    // Update lesson card pill
    const pill = document.getElementById(`badge_${engine.currentLesson.id}`);
    if (pill) {
      pill.textContent = '100% Hoàn thành';
      pill.className = 'lesson-pill-status done';
    }
    const cardItem = document.getElementById(`lessonCard_${engine.currentLesson.id}`);
    if (cardItem) cardItem.classList.add('mastered');

    playSound('celebrate');
    launchConfetti();
    showToast('Xuất sắc! Em đã làm chủ bài học đạt chuẩn!', 'fa-trophy');
  }
}

window.proceedNextLesson = function() {
  showToast('Đang chuyển sang bài tiếp theo...', 'fa-forward-step');
  const items = document.querySelectorAll('.lesson-card-item');
  let found = false;
  items.forEach((item, idx) => {
    if (item.classList.contains('active') && items[idx + 1] && !found) {
      items[idx + 1].click();
      found = true;
    }
  });
};

// Listen to Remote Teacher Focus Lock
async function pollTeacherControl() {
  if (!window.location.protocol.startsWith('http')) return;
  try {
    const res = await fetch('/api/self-study/teacher-control');
    if (res.ok) {
      const control = await res.json();
      engine.applyTeacherControl(control);
      const overlay = document.getElementById('focusLockOverlay');
      if (overlay) overlay.style.display = control.lockAll ? 'flex' : 'none';
      updateStepperState();
    }
  } catch (e) {
    /* silent poll */
  }
}
setInterval(pollTeacherControl, 3500);

// --- TEACHER STUDIO FORM HANDLERS (ENRICHED WITH IMAGE FIELDS) ---
function populateEditorForm(l) {
  if (!l) return;
  const elId = document.getElementById('editLessonId');
  if (elId) elId.value = l.id || '';
  const elGr = document.getElementById('editGrade');
  if (elGr) elGr.value = l.grade || 6;
  const elUn = document.getElementById('editUnit');
  if (elUn) elUn.value = l.unit || '';
  const elDu = document.getElementById('editDuration');
  if (elDu) elDu.value = l.duration || '35 phút';
  const elTi = document.getElementById('editTitle');
  if (elTi) elTi.value = l.title || '';

  const elS1 = document.getElementById('editStep1');
  if (elS1) elS1.value = (l.step1_objectives?.items || []).join('\n');
  const elMt = document.getElementById('editMediaType');
  if (elMt) elMt.value = l.step2_theory?.media?.type || 'none';
  const elMu = document.getElementById('editMediaUrl');
  if (elMu) elMu.value = l.step2_theory?.media?.url || '';
  const elS2 = document.getElementById('editStep2');
  if (elS2) elS2.value = (l.step2_theory?.sections || []).map(s => `### ${s.heading}\n${s.content}`).join('\n\n');
  const elS3 = document.getElementById('editStep3');
  if (elS3) elS3.value = (l.step3_notebook?.points || []).join('\n');

  renderEditorQuizzes(l.step4_practice?.quizzes || []);
}

function renderEditorQuizzes(quizzes) {
  const container = document.getElementById('editorQuizzesList');
  if (!container) return;
  container.innerHTML = sanitizeHTML('');
  quizzes.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'challenge-box';
    div.style.marginBottom = '14px';
    div.innerHTML = sanitizeHTML(`
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>Câu hỏi ${idx + 1}</strong>
        <button class="btn btn-secondary" onclick="removeEditorQuiz(${idx})">
          <i class="fa-solid fa-trash" style="color: var(--accent-rose);"></i> Xóa
        </button>
      </div>
      <input type="text" class="form-input" style="margin: 8px 0;" value="${q.question}" placeholder="Nội dung câu hỏi" onchange="updateEditorQuizQuestion(${idx}, this.value)">
      
      <!-- Hình ảnh minh họa câu hỏi -->
      <div style="margin-bottom: 8px;">
        <label class="form-label" style="font-size: 11px;">Hình ảnh minh họa câu hỏi (tùy chọn URL hoặc assets/img/...):</label>
        <input type="text" class="form-input" value="${q.image || ''}" placeholder="ví dụ: assets/img/hinh_cau_hoi.svg" onchange="updateEditorQuizImage(${idx}, this.value)">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        ${q.options.map((opt, oIdx) => `
          <input type="text" class="form-input" value="${opt}" placeholder="Phương án ${oIdx + 1}" onchange="updateEditorQuizOpt(${idx}, ${oIdx}, this.value)">
        `).join('')}
      </div>
      <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
        <label class="form-label" style="margin: 0;">Đáp án đúng (0: A, 1: B, 2: C, 3: D):</label>
        <input type="number" class="form-input" style="width: 80px;" value="${q.correctIndex}" min="0" max="3" onchange="updateEditorQuizCorrect(${idx}, this.value)">
      </div>
    `);
    container.appendChild(div);
  });
}

window.removeEditorQuiz = function(idx) {
  editor.removeQuizQuestion(idx);
  renderEditorQuizzes(editor.currentLesson.step4_practice.quizzes);
};
window.updateEditorQuizQuestion = function(idx, val) {
  editor.currentLesson.step4_practice.quizzes[idx].question = val;
};
window.updateEditorQuizImage = function(idx, val) {
  editor.currentLesson.step4_practice.quizzes[idx].image = val.trim();
};
window.updateEditorQuizOpt = function(idx, oIdx, val) {
  editor.currentLesson.step4_practice.quizzes[idx].options[oIdx] = val;
};
window.updateEditorQuizCorrect = function(idx, val) {
  editor.currentLesson.step4_practice.quizzes[idx].correctIndex = parseInt(val, 10);
};

const btnAddQuiz = document.getElementById('btnAddQuiz');
if (btnAddQuiz) {
  btnAddQuiz.addEventListener('click', () => {
    editor.addQuizQuestion({
      type: 'single_choice',
      question: 'Câu hỏi mới',
      image: '',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctIndex: 0,
      explanation: 'Giải thích chi tiết phương án'
    });
    renderEditorQuizzes(editor.currentLesson.step4_practice.quizzes);
    showToast('Đã thêm 1 câu hỏi trắc nghiệm', 'fa-plus');
  });
}

function saveFormToEditor() {
  const elId = document.getElementById('editLessonId');
  const elGr = document.getElementById('editGrade');
  const elUn = document.getElementById('editUnit');
  const elDu = document.getElementById('editDuration');
  const elTi = document.getElementById('editTitle');

  const id = elId ? elId.value.trim() : 'lesson';
  const grade = elGr ? parseInt(elGr.value, 10) : 6;
  const unit = elUn ? elUn.value.trim() : '';
  const duration = elDu ? elDu.value.trim() : '35 phút';
  const title = elTi ? elTi.value.trim() : '';

  const elS1 = document.getElementById('editStep1');
  const step1Items = elS1 ? elS1.value.split('\n').map(s => s.trim()).filter(Boolean) : [];
  const elMt = document.getElementById('editMediaType');
  const mediaType = elMt ? elMt.value : 'none';
  const elMu = document.getElementById('editMediaUrl');
  const mediaUrl = elMu ? elMu.value.trim() : '';
  const elS2 = document.getElementById('editStep2');
  const step2Raw = elS2 ? elS2.value.trim() : '';
  const elS3 = document.getElementById('editStep3');
  const step3Items = elS3 ? elS3.value.split('\n').map(s => s.trim()).filter(Boolean) : [];

  editor.currentLesson.id = id;
  editor.currentLesson.grade = grade;
  editor.currentLesson.unit = unit;
  editor.currentLesson.duration = duration;
  editor.currentLesson.title = title;
  editor.currentLesson.step1_objectives = { title: 'Mục Tiêu Bài Học', items: step1Items };
  editor.currentLesson.step2_theory = {
    title: 'Khám Phá Kiến Thức Trọng Tâm',
    media: { type: mediaType, url: mediaUrl, caption: '' },
    sections: [{ heading: 'Nội dung', content: step2Raw }]
  };
  editor.currentLesson.step3_notebook = { title: 'Kiến Thức Cốt Lõi', points: step3Items };
  if (typeof editor.normalizeLessonToSections === 'function') {
    editor.currentLesson = editor.normalizeLessonToSections(editor.currentLesson);
  }
}

const btnSaveLAN = document.getElementById('btnSaveLAN');
if (btnSaveLAN) {
  btnSaveLAN.addEventListener('click', async () => {
    saveFormToEditor();
    try {
      await editor.saveToGateway();
      showToast('Đã lưu bài học lên Máy Chủ LAN!', 'fa-cloud-arrow-up');
      loadManifest();
    } catch (e) {
      showToast('Lỗi lưu LAN: ' + e.message, 'fa-triangle-exclamation');
    }
  });
}

const btnExportJson = document.getElementById('btnExportJson');
if (btnExportJson) {
  btnExportJson.addEventListener('click', () => {
    saveFormToEditor();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(editor.exportToJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${editor.currentLesson.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã tải tệp JSON về máy', 'fa-download');
  });
}

const fileImport = document.getElementById('fileImportJson');
if (fileImport) {
  fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = editor.importFromJson(event.target.result);
        populateEditorForm(imported);
        showToast('Nạp bài học thành công', 'fa-check');
      } catch (err) {
        showToast('Tệp JSON không hợp lệ: ' + err.message, 'fa-triangle-exclamation');
      }
    };
    reader.readAsText(file);
  });
}

const btnNew = document.getElementById('btnNewLesson');
if (btnNew) {
  btnNew.addEventListener('click', () => {
    const blank = editor.createNewLesson();
    populateEditorForm(blank);
    showToast('Đã tạo phôi bài học mới', 'fa-plus');
  });
}

// Media Pre-flight Validator in Teacher Studio
window.testMediaUrlAction = function() {
  const urlInput = document.getElementById('editMediaUrl');
  const url = (urlInput ? urlInput.value : '').trim();
  const feedback = document.getElementById('mediaFeedback');
  const previewWrapper = document.getElementById('mediaPreviewWrapper');
  const previewContainer = document.getElementById('mediaPreviewContainer');

  if (!url) {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.color = 'var(--accent-red)';
      feedback.innerHTML = sanitizeHTML('<i class="fa-solid fa-circle-exclamation"></i> Vui lòng dán link video vào ô trước khi kiểm tra.');
    }
    return;
  }

  const val = typeof SelfStudyMedia !== 'undefined'
    ? SelfStudyMedia.validateMediaUrl(url)
    : { ok: true, embedUrl: url, message: 'Đường dẫn hợp lệ' };

  if (feedback) {
    feedback.style.display = 'block';
    if (val.ok) {
      feedback.style.color = 'var(--accent-green)';
      feedback.innerHTML = sanitizeHTML(`<i class="fa-solid fa-circle-check"></i> ${val.message}`);
    } else {
      feedback.style.color = 'var(--accent-red)';
      feedback.innerHTML = sanitizeHTML(`<i class="fa-solid fa-circle-xmark"></i> ${val.message}`);
    }
  }

  if (val.ok && previewWrapper && previewContainer) {
    const renderFn = typeof SelfStudyMedia !== 'undefined' ? SelfStudyMedia.renderMediaHtml : renderMediaMarkup;
    previewContainer.innerHTML = sanitizeHTML(renderFn({ type: 'video', url }));
    previewWrapper.style.display = 'block';
  } else if (previewWrapper) {
    previewWrapper.style.display = 'none';
  }
};

const btnTestMedia = document.getElementById('btnTestMedia');
const btnCloseMediaPreview = document.getElementById('btnCloseMediaPreview');
const mediaPreviewWrapper = document.getElementById('mediaPreviewWrapper');
const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');

if (btnTestMedia) {
  btnTestMedia.addEventListener('click', (e) => {
    e.preventDefault();
    window.testMediaUrlAction();
  });
}

if (btnCloseMediaPreview && mediaPreviewWrapper) {
  btnCloseMediaPreview.addEventListener('click', () => {
    mediaPreviewWrapper.style.display = 'none';
    if (mediaPreviewContainer) mediaPreviewContainer.textContent = '';
  });
}

// Initial Kickoff
updateModeDisplay();
loadManifest();
if (isTeacherMode) {
  populateEditorForm(engine.currentLesson || editor.currentLesson);
}
