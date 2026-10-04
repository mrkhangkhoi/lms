// tests/test_dynamic_lesson_schema.js
const assert = require('assert');
const path = require('path');

console.log('[TEST] Checking Dynamic Lesson Schema & Adapter...');

const SelfStudyEditor = require(path.resolve(__dirname, '../js/self_study_editor.js'));
const editor = new SelfStudyEditor();

// 1. Adapter: Old 4-step lesson normalized to sections
const oldLesson = {
  id: 'tin6_bai_legacy',
  grade: 6,
  unit: 'Chủ đề A',
  title: 'Bài học cũ',
  step1_objectives: { title: 'Mục tiêu', items: ['Yêu cầu 1', 'Yêu cầu 2'] },
  step2_theory: {
    title: 'Lý thuyết',
    media: { type: 'video', url: 'https://youtu.be/k4S_f3p82kM' },
    sections: [{ heading: 'Phần 1', content: 'Nội dung' }]
  },
  step3_notebook: { title: 'Ghi vở', points: ['Ý 1', 'Ý 2'] },
  step4_practice: { title: 'Luyện tập', quizzes: [{ question: 'Q1' }] }
};

const normalized = editor.normalizeLessonToSections(oldLesson);
assert.ok(Array.isArray(normalized.sections), 'Must produce sections array');
assert.strictEqual(normalized.sections.length, 4, 'Legacy 4-step must normalize to 4 sections');
assert.strictEqual(normalized.sections[0].type, 'objectives');
assert.strictEqual(normalized.sections[1].type, 'theory');
assert.strictEqual(normalized.sections[1].media.url, 'https://youtu.be/k4S_f3p82kM');
assert.strictEqual(normalized.sections[2].type, 'notebook');
assert.strictEqual(normalized.sections[3].type, 'practice');

// 2. Dynamic section management in SelfStudyEditor
editor.loadLesson(normalized);

// Add custom section
editor.addSection('theory', 'Nội dung mở rộng');
assert.strictEqual(editor.currentLesson.sections.length, 5);
assert.strictEqual(editor.currentLesson.sections[4].title, 'Nội dung mở rộng');
assert.strictEqual(editor.currentLesson.sections[4].type, 'theory');

// Move section up
editor.moveSection(4, 'up');
assert.strictEqual(editor.currentLesson.sections[3].title, 'Nội dung mở rộng');

// Move section down
editor.moveSection(3, 'down');
assert.strictEqual(editor.currentLesson.sections[4].title, 'Nội dung mở rộng');

// Remove section
editor.removeSection(4);
assert.strictEqual(editor.currentLesson.sections.length, 4);

console.log('[PASS] Dynamic Lesson Schema & Adapter tests passed!');
