/**
 * CVALMS PRO - SELF-STUDY LEARNING ENGINE (Player Engine)
 * Data-Driven, Active Engagement Gating, Anti-Skipping, Web Audio, Markdown & LAN Sync
 */

class SelfStudyEngine {
  constructor(options = {}) {
    this.deskId = options.deskId || 'MAY-00';
    this.studentName = options.studentName || 'Học sinh';
    this.gatewayUrl = options.gatewayUrl || (typeof window !== 'undefined' ? window.location?.origin : 'http://127.0.0.1:49150');

    this.currentLesson = null;
    this.unlockedStep = 1;
    this.completedSteps = new Set();
    this.userAnswers = {
      cloze: null,
      quizzes: {}
    };

    // Active Engagement & Anti-Skipping Tracking
    this.minDwellTime = options.minDwellTime !== undefined ? options.minDwellTime : 25; // seconds
    this.interactions = {
      step1_checked: new Set(),
      step2_dwellElapsed: 0,
      step3_notesChecked: new Set()
    };

    this.teacherControl = {
      lockAll: false,
      maxStep: 4,
      allowFreeRoam: false
    };

    this.audioCtx = null;
    this.initAudio();
  }

  initAudio() {
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      try {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioClass();
      } catch (e) {
        this.audioCtx = null;
      }
    }
  }

  playAudioFeedback(isCorrect) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      if (isCorrect) {
        // C major cheerful arpeggio (C5=523.25, E5=659.25, G5=783.99)
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.2, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
      } else {
        // Lower warning beep (G3=196.00)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(196.00, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio playback error silent fallback
    }
  }

  loadLesson(lessonData) {
    if (lessonData && typeof lessonData === 'object' && !Array.isArray(lessonData.sections)) {
      if (typeof SelfStudyEditor !== 'undefined' && SelfStudyEditor.prototype && typeof SelfStudyEditor.prototype.normalizeLessonToSections === 'function') {
        const editorHelper = new SelfStudyEditor();
        this.currentLesson = editorHelper.normalizeLessonToSections(lessonData);
      } else {
        this.currentLesson = lessonData;
      }
    } else {
      this.currentLesson = lessonData;
    }
    this.unlockedStep = 1;
    this.completedSteps = new Set();
    this.userAnswers = {
      cloze: null,
      quizzes: {}
    };
    this.interactions = {
      step1_checked: new Set(),
      step2_dwellElapsed: 0,
      step3_notesChecked: new Set()
    };

    // Restore from localStorage if exists
    if (typeof localStorage !== 'undefined' && lessonData?.id) {
      try {
        const saved = localStorage.getItem(`cvalms_self_study_${lessonData.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.unlockedStep = parsed.unlockedStep || 1;
          this.completedSteps = new Set(parsed.completedSteps || []);
          this.userAnswers = parsed.userAnswers || { cloze: null, quizzes: {} };
          if (parsed.interactions) {
            if (Array.isArray(parsed.interactions.step1_checked)) {
              this.interactions.step1_checked = new Set(parsed.interactions.step1_checked);
            }
            if (Array.isArray(parsed.interactions.step3_notesChecked)) {
              this.interactions.step3_notesChecked = new Set(parsed.interactions.step3_notesChecked);
            }
            this.interactions.step2_dwellElapsed = parsed.interactions.step2_dwellElapsed || 0;
          }
        }
      } catch (e) { /* ignore storage error */ }
    }
  }

  saveProgressLocal() {
    if (typeof localStorage !== 'undefined' && this.currentLesson?.id) {
      try {
        localStorage.setItem(`cvalms_self_study_${this.currentLesson.id}`, JSON.stringify({
          unlockedStep: this.unlockedStep,
          completedSteps: Array.from(this.completedSteps),
          userAnswers: this.userAnswers,
          interactions: {
            step1_checked: Array.from(this.interactions.step1_checked),
            step2_dwellElapsed: this.interactions.step2_dwellElapsed,
            step3_notesChecked: Array.from(this.interactions.step3_notesChecked)
          }
        }));
      } catch (e) { /* ignore storage error */ }
    }
  }

  // --- ACTIVE ENGAGEMENT VERIFICATION (ANTI-SKIPPING) ---
  toggleObjective(index) {
    if (this.interactions.step1_checked.has(index)) {
      this.interactions.step1_checked.delete(index);
    } else {
      this.interactions.step1_checked.add(index);
    }
    this.saveProgressLocal();
    return this.interactions.step1_checked.has(index);
  }

  isStep1Ready() {
    if (this.teacherControl.allowFreeRoam) return true;
    const total = this.currentLesson?.step1_objectives?.items?.length || 0;
    if (total === 0) return true;
    return this.interactions.step1_checked.size >= total;
  }

  tickDwellTime(seconds = 1) {
    this.interactions.step2_dwellElapsed += seconds;
    this.saveProgressLocal();
    return this.interactions.step2_dwellElapsed;
  }

  isStep2Ready() {
    if (this.teacherControl.allowFreeRoam) return true;
    return this.interactions.step2_dwellElapsed >= this.minDwellTime;
  }

  toggleNotebook(index) {
    if (this.interactions.step3_notesChecked.has(index)) {
      this.interactions.step3_notesChecked.delete(index);
    } else {
      this.interactions.step3_notesChecked.add(index);
    }
    this.saveProgressLocal();
    return this.interactions.step3_notesChecked.has(index);
  }

  isStep3Ready() {
    if (this.teacherControl.allowFreeRoam) return true;
    const total = this.currentLesson?.step3_notebook?.points?.length || 0;
    if (total === 0) return true;
    return this.interactions.step3_notesChecked.size >= total;
  }

  // --- STEP ACCESS CONTROLLER ---
  canAccessStep(step) {
    if (this.teacherControl.lockAll) return false;
    if (step > this.teacherControl.maxStep) return false;
    if (this.teacherControl.allowFreeRoam) return true;

    // Gated Progression: Step 1 is always accessible.
    // Step N requires Step N-1 to be completed.
    if (step === 1) return true;
    for (let s = 1; s < step; s++) {
      if (!this.completedSteps.has(s)) return false;
    }
    return true;
  }

  isStepCompleted(step) {
    return this.completedSteps.has(step);
  }

  completeStep(step) {
    this.completedSteps.add(step);
    const maxSteps = (this.currentLesson && Array.isArray(this.currentLesson.sections) && this.currentLesson.sections.length > 0)
      ? this.currentLesson.sections.length
      : 4;
    if (step + 1 <= maxSteps && this.unlockedStep <= step) {
      this.unlockedStep = step + 1;
    }
    this.saveProgressLocal();
    this.reportProgressToGateway();
  }

  evaluateCloze(selectedWord) {
    if (!this.currentLesson?.step4_practice?.cloze) return { isCorrect: false };
    const cloze = this.currentLesson.step4_practice.cloze;
    const isCorrect = String(selectedWord).trim().toLowerCase() === String(cloze.blank).trim().toLowerCase();
    this.userAnswers.cloze = {
      answer: selectedWord,
      isCorrect
    };
    this.playAudioFeedback(isCorrect);
    this.saveProgressLocal();
    return {
      isCorrect,
      explanation: cloze.explanation
    };
  }

  evaluateQuiz(quizIndex, selectedOptionIndex) {
    if (!this.currentLesson?.step4_practice?.quizzes) return { isCorrect: false };
    const quiz = this.currentLesson.step4_practice.quizzes[quizIndex];
    if (!quiz) return { isCorrect: false };

    const isCorrect = Number(selectedOptionIndex) === Number(quiz.correctIndex);
    this.userAnswers.quizzes[quizIndex] = {
      selectedIndex: selectedOptionIndex,
      isCorrect
    };
    this.playAudioFeedback(isCorrect);
    this.saveProgressLocal();
    return {
      isCorrect,
      explanation: quiz.explanation
    };
  }

  calculateScore() {
    let total = 0;
    let correct = 0;

    if (this.currentLesson?.step4_practice?.cloze) {
      total += 1;
      if (this.userAnswers.cloze?.isCorrect) correct += 1;
    }

    if (this.currentLesson?.step4_practice?.quizzes) {
      const quizzes = this.currentLesson.step4_practice.quizzes;
      total += quizzes.length;
      quizzes.forEach((_, idx) => {
        if (this.userAnswers.quizzes[idx]?.isCorrect) correct += 1;
      });
    }

    const percent = total > 0 ? Math.round((correct / total) * 100) : 100;
    const passed = percent >= 70;

    return {
      total,
      correct,
      percent,
      passed,
      formattedScore: `${correct}/${total}`
    };
  }

  applyTeacherControl(control) {
    if (!control) return;
    if (typeof control.lockAll === 'boolean') this.teacherControl.lockAll = control.lockAll;
    if (typeof control.maxStep === 'number') this.teacherControl.maxStep = control.maxStep;
    if (typeof control.allowFreeRoam === 'boolean') this.teacherControl.allowFreeRoam = control.allowFreeRoam;
  }

  async reportProgressToGateway() {
    if (typeof fetch === 'undefined') return;
    const scoreInfo = this.calculateScore();
    const highestStepCompleted = Math.max(0, ...Array.from(this.completedSteps));
    const isFinished = this.isStepCompleted(4) && scoreInfo.passed;

    const payload = {
      deskId: this.deskId,
      studentName: this.studentName,
      lessonId: this.currentLesson?.id || '',
      step: highestStepCompleted,
      score: scoreInfo.formattedScore,
      completed: isFinished
    };

    try {
      await fetch(`${this.gatewayUrl}/api/self-study/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // Network offline, progress safely kept in localStorage
    }
  }

  renderMarkdown(text) {
    if (!text) return '';
    let html = String(text);

    // Code blocks
    html = html.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Markdown Images: ![caption](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div class="lesson-inline-img-box"><img src="$2" alt="$1" class="lesson-inline-img" loading="lazy"/><div class="lesson-img-caption"><i class="fa-solid fa-image"></i> $1</div></div>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Unordered lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    // Paragraph line breaks
    html = html.replace(/\n\n/g, '<br/><br/>');

    return html;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelfStudyEngine;
}
if (typeof window !== 'undefined') {
  window.SelfStudyEngine = SelfStudyEngine;
}
