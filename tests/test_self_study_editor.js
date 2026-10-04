// tests/test_self_study_editor.js
const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('[TEST] Checking Self-Study Editor Core Logic...');

let SelfStudyEditor;
try {
  SelfStudyEditor = require(path.resolve(__dirname, '../js/self_study_editor.js'));
} catch (e) {
  // Expected to fail before file created
}

assert.ok(SelfStudyEditor, 'SelfStudyEditor must be defined');

const editor = new SelfStudyEditor();

// 1. Initial blank lesson creation
const blank = editor.createNewLesson('tin8_bai5', 8);
assert.strictEqual(blank.id, 'tin8_bai5');
assert.strictEqual(blank.grade, 8);
assert.ok(Array.isArray(blank.step1_objectives.items));
assert.ok(Array.isArray(blank.step2_theory.sections));
assert.ok(Array.isArray(blank.step3_notebook.points));
assert.ok(Array.isArray(blank.step4_practice.quizzes));

// 2. Add and remove questions
editor.loadLesson(blank);
editor.addQuizQuestion({
  type: 'single_choice',
  question: 'Câu hỏi mới là gì?',
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 2,
  explanation: 'Giải thích chi tiết C là đúng.'
});
assert.strictEqual(editor.currentLesson.step4_practice.quizzes.length, 1);
assert.strictEqual(editor.currentLesson.step4_practice.quizzes[0].correctIndex, 2);

editor.removeQuizQuestion(0);
assert.strictEqual(editor.currentLesson.step4_practice.quizzes.length, 0);

// 3. Set cloze test
editor.setClozeChallenge('Hệ điều hành quản lý dữ liệu dưới dạng', 'tệp tin', ['tệp tin', 'thư mục', 'ổ đĩa'], 'Chính xác!');
assert.strictEqual(editor.currentLesson.step4_practice.cloze.blank, 'tệp tin');

// 4. JSON Serialization & Validation
const jsonStr = editor.exportToJson();
assert.ok(jsonStr.includes('tin8_bai5'));

const parsed = editor.importFromJson(jsonStr);
assert.strictEqual(parsed.id, 'tin8_bai5');

// 5. GitHub sync payload generator test
const ghPayload = editor.buildGitHubCommitPayload(
  'tin8_bai5',
  parsed,
  'Soạn bài học mới: tin8_bai5'
);
assert.ok(ghPayload.message.includes('tin8_bai5'));
assert.ok(typeof ghPayload.content === 'string', 'GitHub content must be base64 string');
const decodedContent = Buffer.from(ghPayload.content, 'base64').toString('utf8');
assert.ok(decodedContent.includes('tin8_bai5'));

console.log('[PASS] SelfStudyEditor core logic verified successfully!');
