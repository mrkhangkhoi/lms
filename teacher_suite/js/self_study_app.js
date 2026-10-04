/**
 * CVALMS PRO - SELF-STUDY CLIENT INTERFACE APP
 * Orchestrates Engine, Editor, Audio & DOM Rendering
 */

const sanitizeHTML = (h) => (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(h) : h);

// Logic kết nối giao diện
const engine = new SelfStudyEngine({
  deskId: (typeof localStorage !== 'undefined' && localStorage.getItem('cvalms_desk_id')) || 'MAY-01',
  studentName: (typeof localStorage !== 'undefined' && localStorage.getItem('cvalms_student_name')) || 'Học sinh'
});
const editor = new SelfStudyEditor();

let manifestData = null;
let currentGrade = '6';

const deskBadge = document.getElementById('deskBadge');
if (deskBadge) deskBadge.textContent = engine.deskId;

// Toàn màn hình
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

// Chuyển đổi qua lại giữa Chế độ Học sinh và Soạn bài Giáo viên
let isTeacherMode = new URLSearchParams(window.location.search).get('role') === 'teacher';
function updateModeDisplay() {
  const studentWorkspace = document.getElementById('studentWorkspace');
  const teacherWorkspace = document.getElementById('teacherWorkspace');
  const btnToggle = document.getElementById('btnToggleStudio');
  const sidebar = document.getElementById('sidebar');

  if (isTeacherMode) {
    if (studentWorkspace) studentWorkspace.style.display = 'none';
    if (teacherWorkspace) teacherWorkspace.style.display = 'block';
    if (sidebar) sidebar.style.display = 'none';
    if (btnToggle) btnToggle.textContent = '🎓 Chế độ Học sinh';
  } else {
    if (studentWorkspace) studentWorkspace.style.display = 'block';
    if (teacherWorkspace) teacherWorkspace.style.display = 'none';
    if (sidebar) sidebar.style.display = 'flex';
    if (btnToggle) btnToggle.textContent = '⚙️ Soạn bài giảng';
  }
}

const btnToggleStudio = document.getElementById('btnToggleStudio');
if (btnToggleStudio) {
  btnToggleStudio.addEventListener('click', () => {
    isTeacherMode = !isTeacherMode;
    updateModeDisplay();
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
  });
}

// Tải Manifest danh mục
async function loadManifest() {
  try {
    const res = await fetch('lessons/manifest.json');
    if (res.ok) {
      manifestData = await res.json();
      renderGradeLessons(currentGrade);
    }
  } catch (e) {
    console.error('Không tải được manifest.json:', e);
  }
}

// Chọn khối lớp
document.querySelectorAll('.grade-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.grade-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentGrade = tab.dataset.grade;
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
    listEl.innerHTML = sanitizeHTML('<div style="color: var(--text-muted); padding: 12px;">Chưa có bài học cho khối này.</div>');
    return;
  }

  group.lessons.forEach((l, idx) => {
    const item = document.createElement('div');
    item.className = 'lesson-item';
    item.innerHTML = sanitizeHTML(`
      <div class="lesson-item-unit">${l.unit}</div>
      <div class="lesson-item-title">${l.title}</div>
      <div class="lesson-item-meta">
        <span>⏱️ ${l.duration || '35 phút'}</span>
        <span id="badge_${l.id}"></span>
      </div>
    `);
    item.addEventListener('click', () => {
      document.querySelectorAll('.lesson-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      loadLessonById(l.id, l.file);
    });
    listEl.appendChild(item);

    if (idx === 0) item.click();
  });
}

async function loadLessonById(id, file) {
  try {
    const res = await fetch(`lessons/${file}`);
    if (res.ok) {
      const lesson = await res.json();
      engine.loadLesson(lesson);
      editor.loadLesson(lesson);
      renderStudentLesson();
    }
  } catch (e) {
    console.error('Không tải được bài học:', e);
  }
}

function renderStudentLesson() {
  const l = engine.currentLesson;
  if (!l) return;

  const uEl = document.getElementById('lessonUnit');
  const tEl = document.getElementById('lessonTitle');
  if (uEl) uEl.textContent = l.unit;
  if (tEl) tEl.textContent = l.title;

  // Bước 1
  const s1List = document.getElementById('step1List');
  if (s1List) {
    s1List.innerHTML = sanitizeHTML((l.step1_objectives?.items || []).map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join(''));
  }

  // Bước 2
  const mediaBox = document.getElementById('mediaBox');
  if (mediaBox) {
    if (l.step2_theory?.media && l.step2_theory.media.type !== 'none' && l.step2_theory.media.url) {
      mediaBox.style.display = 'block';
      if (l.step2_theory.media.type === 'video') {
        if (l.step2_theory.media.url.includes('youtube') || l.step2_theory.media.url.includes('youtu.be')) {
          mediaBox.innerHTML = sanitizeHTML(`<iframe src="${l.step2_theory.media.url}" allowfullscreen></iframe>`);
        } else {
          mediaBox.innerHTML = sanitizeHTML(`<video src="${l.step2_theory.media.url}" controls></video>`);
        }
      } else {
        mediaBox.innerHTML = sanitizeHTML(`<img src="${l.step2_theory.media.url}" alt="Illustration">`);
      }
    } else {
      mediaBox.style.display = 'none';
    }
  }

  const s2Content = document.getElementById('step2Content');
  if (s2Content) {
    s2Content.innerHTML = sanitizeHTML((l.step2_theory?.sections || []).map(s => `
      <h3 style="margin: 16px 0 8px 0; color: var(--accent-cyan);">${s.heading}</h3>
      <div>${engine.renderMarkdown(s.content)}</div>
    `).join(''));
  }

  const infoGrid = document.getElementById('infographicGrid');
  if (infoGrid) {
    infoGrid.innerHTML = sanitizeHTML('');
    if (l.step2_theory?.sections) {
      l.step2_theory.sections.forEach(s => {
        if (s.infographicCards) {
          s.infographicCards.forEach(card => {
            const c = document.createElement('div');
            c.className = 'info-card';
            c.style.borderLeftColor = card.color || 'var(--accent-cyan)';
            c.innerHTML = sanitizeHTML(`
              <div class="info-card-title">${card.title}</div>
              <div class="info-card-desc">${card.desc}</div>
            `);
            infoGrid.appendChild(c);
          });
        }
      });
    }
  }

  // Bước 3
  const s3List = document.getElementById('step3List');
  if (s3List) {
    s3List.innerHTML = sanitizeHTML((l.step3_notebook?.points || []).map(p => `<li>${p}</li>`).join(''));
  }

  // Bước 4
  renderStep4();
  updateStepsLockState();
}

function renderStep4() {
  const l = engine.currentLesson;
  const clozeContainer = document.getElementById('clozeContainer');
  const quizzesContainer = document.getElementById('quizzesContainer');
  if (clozeContainer) clozeContainer.innerHTML = sanitizeHTML('');
  if (quizzesContainer) quizzesContainer.innerHTML = sanitizeHTML('');

  if (clozeContainer && l.step4_practice?.cloze) {
    const cl = l.step4_practice.cloze;
    const box = document.createElement('div');
    box.className = 'cloze-challenge-box';
    box.innerHTML = sanitizeHTML(`
      <div class="cloze-sentence">
        ${cl.text} <span id="clozeTarget" class="cloze-blank-target">${engine.userAnswers.cloze ? engine.userAnswers.cloze.answer : '... (Chọn từ bên dưới) ...'}</span>
      </div>
      <div class="cloze-options">
        ${(cl.options || []).map(opt => `<button class="chip-option" onclick="handleClozeSelect('${opt}')">${opt}</button>`).join('')}
      </div>
      <div id="clozeFeedback" style="margin-top: 10px; display: none;"></div>
    `);
    clozeContainer.appendChild(box);
  }

  if (quizzesContainer && l.step4_practice?.quizzes) {
    l.step4_practice.quizzes.forEach((q, qIdx) => {
      const qBox = document.createElement('div');
      qBox.className = 'quiz-item';
      qBox.innerHTML = sanitizeHTML(`
        <div class="quiz-question">Câu ${qIdx + 1}: ${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, optIdx) => `
            <button class="quiz-opt-btn" id="q_${qIdx}_opt_${optIdx}" onclick="handleQuizSelect(${qIdx}, ${optIdx})">${opt}</button>
          `).join('')}
        </div>
        <div id="quizFeedback_${qIdx}" class="quiz-explanation" style="display: none;"></div>
      `);
      quizzesContainer.appendChild(qBox);
    });
  }
}

window.handleClozeSelect = function(word) {
  const res = engine.evaluateCloze(word);
  const target = document.getElementById('clozeTarget');
  if (target) target.textContent = word;
  const fb = document.getElementById('clozeFeedback');
  if (fb) {
    fb.style.display = 'block';
    fb.innerHTML = sanitizeHTML(res.isCorrect ? `<span style="color: var(--accent-emerald);">✓ Chính xác! ${res.explanation}</span>` : `<span style="color: var(--accent-rose);">✗ Chưa đúng, hãy thử lại!</span>`);
  }
  checkAssessmentFinished();
};

window.handleQuizSelect = function(qIdx, optIdx) {
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
    fb.innerHTML = sanitizeHTML(res.isCorrect ? `✓ ${res.explanation}` : `✗ Lựa chọn chưa chính xác. ${res.explanation}`);
  }
  checkAssessmentFinished();
};

function checkAssessmentFinished() {
  const score = engine.calculateScore();
  if (score.passed) {
    engine.completeStep(4);
    const banner = document.getElementById('scoreBanner');
    if (banner) banner.style.display = 'block';
    const detail = document.getElementById('scoreDetail');
    if (detail) detail.textContent = `Kết quả: ${score.formattedScore} câu đúng (${score.percent}%)`;
  }
  updateStepsLockState();
}

function updateStepsLockState() {
  for (let s = 1; s <= 4; s++) {
    const card = document.getElementById(`stepCard${s}`);
    if (!card) continue;
    const canAccess = engine.canAccessStep(s);
    const isDone = engine.isStepCompleted(s);

    if (canAccess) {
      card.classList.remove('locked');
    } else {
      card.classList.add('locked');
    }

    if (isDone) {
      card.classList.add('completed');
    } else {
      card.classList.remove('completed');
    }
  }

  // Thanh tiến độ chung
  const completedCount = engine.completedSteps.size;
  const pct = Math.round((completedCount / 4) * 100);
  const pBar = document.getElementById('progressBar');
  const pPct = document.getElementById('progressPercent');
  if (pBar) pBar.style.width = `${pct}%`;
  if (pPct) pPct.textContent = `${pct}%`;
}

// Các nút hoàn thành bước
const btnS1 = document.getElementById('btnCompleteStep1');
if (btnS1) {
  btnS1.addEventListener('click', () => {
    engine.completeStep(1);
    updateStepsLockState();
    const c2 = document.getElementById('stepCard2');
    if (c2) c2.scrollIntoView({ behavior: 'smooth' });
  });
}
const btnS2 = document.getElementById('btnCompleteStep2');
if (btnS2) {
  btnS2.addEventListener('click', () => {
    engine.completeStep(2);
    updateStepsLockState();
    const c3 = document.getElementById('stepCard3');
    if (c3) c3.scrollIntoView({ behavior: 'smooth' });
  });
}
const btnS3 = document.getElementById('btnCompleteStep3');
if (btnS3) {
  btnS3.addEventListener('click', () => {
    engine.completeStep(3);
    updateStepsLockState();
    const c4 = document.getElementById('stepCard4');
    if (c4) c4.scrollIntoView({ behavior: 'smooth' });
  });
}

// Lắng nghe lệnh điều khiển từ xa của Giáo viên
async function pollTeacherControl() {
  try {
    const res = await fetch('/api/self-study/teacher-control');
    if (res.ok) {
      const control = await res.json();
      engine.applyTeacherControl(control);
      const overlay = document.getElementById('focusLockOverlay');
      if (overlay) overlay.style.display = control.lockAll ? 'flex' : 'none';
      updateStepsLockState();
    }
  } catch (e) {
    /* silent poll */
  }
}
setInterval(pollTeacherControl, 3000);

// Xử lý Editor Form
function populateEditorForm(l) {
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
    div.className = 'step-card';
    div.style.marginBottom = '12px';
    div.innerHTML = sanitizeHTML(`
      <div style="display: flex; justify-content: space-between;">
        <strong>Câu ${idx + 1}</strong>
        <button class="btn btn-secondary" onclick="removeEditorQuiz(${idx})">🗑️ Xóa</button>
      </div>
      <input type="text" class="editor-input" style="margin: 8px 0;" value="${q.question}" placeholder="Nội dung câu hỏi" onchange="updateEditorQuizQuestion(${idx}, this.value)">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        ${q.options.map((opt, oIdx) => `
          <input type="text" class="editor-input" value="${opt}" placeholder="Lựa chọn ${oIdx + 1}" onchange="updateEditorQuizOpt(${idx}, ${oIdx}, this.value)">
        `).join('')}
      </div>
      <div style="margin-top: 8px;">
        <label class="editor-label">Đáp án đúng (0 là A, 1 là B...):</label>
        <input type="number" class="editor-input" style="width: 100px;" value="${q.correctIndex}" min="0" max="3" onchange="updateEditorQuizCorrect(${idx}, this.value)">
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
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctIndex: 0,
      explanation: 'Giải thích chi tiết phương án'
    });
    renderEditorQuizzes(editor.currentLesson.step4_practice.quizzes);
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
}

const btnSaveLAN = document.getElementById('btnSaveLAN');
if (btnSaveLAN) {
  btnSaveLAN.addEventListener('click', async () => {
    saveFormToEditor();
    try {
      await editor.saveToGateway();
      alert('✅ Đã lưu bài học lên Máy Chủ LAN thành công!');
      loadManifest();
    } catch (e) {
      alert('❌ Lỗi lưu lên Máy Chủ LAN: ' + e.message);
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
        alert('✅ Nạp dữ liệu bài học thành công!');
      } catch (err) {
        alert('❌ Tệp JSON không hợp lệ: ' + err.message);
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
  });
}

// Khởi tạo
updateModeDisplay();
loadManifest();
