// tests/test_self_study_engine.js
const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('[TEST] Checking Self-Study Engine Logic...');

// Load lesson data for testing
const lessonSample = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../lessons/tin6_bai12.json'), 'utf8'));

// Mock browser window and DOM globals
global.window = {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
};

// Require the engine
const enginePath = path.resolve(__dirname, '../js/self_study_engine.js');
let SelfStudyEngine;
try {
  SelfStudyEngine = require(enginePath);
} catch (e) {
  // Expected to fail before file created
}

assert.ok(SelfStudyEngine, 'SelfStudyEngine must be defined');

const engine = new SelfStudyEngine({
  deskId: 'MAY-03',
  studentName: 'Nguyen Thi C'
});

// 1. Load lesson
engine.loadLesson(lessonSample);
assert.strictEqual(engine.currentLesson.id, 'tin6_bai12');
assert.strictEqual(engine.unlockedStep, 1, 'Initial unlocked step must be 1');

// 2. Gated progression check
assert.strictEqual(engine.canAccessStep(1), true, 'Step 1 must be accessible');
assert.strictEqual(engine.canAccessStep(2), false, 'Step 2 must be locked before Step 1 completed');

// Complete Step 1
engine.completeStep(1);
assert.strictEqual(engine.isStepCompleted(1), true);
assert.strictEqual(engine.canAccessStep(2), true, 'Step 2 must be unlocked after Step 1 completed');
assert.strictEqual(engine.canAccessStep(3), false, 'Step 3 must still be locked');

// Complete Step 2 & 3
engine.completeStep(2);
assert.strictEqual(engine.canAccessStep(3), true);
engine.completeStep(3);
assert.strictEqual(engine.canAccessStep(4), true);

// 3. Quiz & Cloze evaluation
// Step 4 evaluations
const clozeResCorrect = engine.evaluateCloze('từng bước rõ ràng');
assert.strictEqual(clozeResCorrect.isCorrect, true);

const clozeResWrong = engine.evaluateCloze('ngẫu nhiên tùy ý');
assert.strictEqual(clozeResWrong.isCorrect, false);

// Re-select correct answer
const clozeResCorrect2 = engine.evaluateCloze('từng bước rõ ràng');
assert.strictEqual(clozeResCorrect2.isCorrect, true);

const quiz0Correct = engine.evaluateQuiz(0, 1); // correctIndex is 1
assert.strictEqual(quiz0Correct.isCorrect, true);

const quiz1Wrong = engine.evaluateQuiz(1, 0); // correctIndex is 1
assert.strictEqual(quiz1Wrong.isCorrect, false);

const finalScore = engine.calculateScore();
assert.strictEqual(finalScore.total, 3, '2 quizzes + 1 cloze = 3');
assert.strictEqual(finalScore.correct, 2, '2 correct answers');

// 4. Teacher remote override
engine.applyTeacherControl({ lockAll: true, maxStep: 4 });
assert.strictEqual(engine.canAccessStep(1), false, 'When teacher lockAll=true, steps must be blocked');

engine.applyTeacherControl({ lockAll: false, maxStep: 2 });
assert.strictEqual(engine.canAccessStep(3), false, 'When teacher maxStep=2, step 3 must be blocked');

// 5. Markdown rendering test
const md = '# Tiêu đề\n**Đậm** và *Nghiêng*\n```python\nprint("Hello")\n```';
const html = engine.renderMarkdown(md);
assert.ok(html.includes('<h1>Tiêu đề</h1>'));
assert.ok(html.includes('<strong>Đậm</strong>'));
assert.ok(html.includes('<em>Nghiêng</em>'));
assert.ok(html.includes('<pre><code>print("Hello")</code></pre>'));

console.log('[PASS] SelfStudyEngine logic verified successfully!');
