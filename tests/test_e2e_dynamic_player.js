// tests/test_e2e_dynamic_player.js
const assert = require('assert');
const path = require('path');

console.log('[TEST] Checking Dynamic Stepper and Universal Video Embeds...');

const SelfStudyMedia = require(path.resolve(__dirname, '../js/self_study_media.js'));
const SelfStudyEngine = require(path.resolve(__dirname, '../js/self_study_engine.js'));
const SelfStudyEditor = require(path.resolve(__dirname, '../js/self_study_editor.js'));

const editor = new SelfStudyEditor();
const engine = new SelfStudyEngine({ deskId: 'TEST-01', studentName: 'Em Học Sinh' });

// 1. Create a 5-section dynamic lesson
const dynamicLesson = {
  id: 'tin6_dynamic_5',
  grade: 6,
  unit: 'Chủ đề A',
  title: 'Bài học 5 mục linh hoạt',
  duration: '40 phút',
  sections: [
    { id: 's1', type: 'objectives', title: '1. Yêu cầu cần đạt', items: ['Yêu cầu A'] },
    { id: 's2', type: 'theory', title: '2. Video mở đầu', media: { type: 'video', url: 'https://youtu.be/k4S_f3p82kM' } },
    { id: 's3', type: 'theory', title: '3. Video Google Drive', media: { type: 'video', url: 'https://drive.google.com/file/d/12345ABCDE/view' } },
    { id: 's4', type: 'notebook', title: '4. Ghi nhớ', points: ['Ý 1'] },
    { id: 's5', type: 'practice', title: '5. Đánh giá cuối bài', quizzes: [{ question: 'Q1' }] }
  ]
};

engine.loadLesson(dynamicLesson);
assert.strictEqual(engine.currentLesson.sections.length, 5);

// 2. Stepper progress calculations for dynamic N steps
function calculateDynamicProgress(completedSet, totalSteps) {
  if (!totalSteps || totalSteps <= 0) return 0;
  return Math.min(100, Math.round((completedSet.size / totalSteps) * 100));
}

assert.strictEqual(calculateDynamicProgress(new Set([1]), 5), 20);
assert.strictEqual(calculateDynamicProgress(new Set([1, 2, 3]), 5), 60);
assert.strictEqual(calculateDynamicProgress(new Set([1, 2, 3, 4, 5]), 5), 100);

// 3. Media Rendering
const ytHtml = SelfStudyMedia.renderMediaHtml(dynamicLesson.sections[1].media);
assert.ok(ytHtml.includes('iframe'), 'Must render iframe for YouTube');
assert.ok(ytHtml.includes('k4S_f3p82kM'), 'Must include video id');

const gdHtml = SelfStudyMedia.renderMediaHtml(dynamicLesson.sections[2].media);
assert.ok(gdHtml.includes('iframe'), 'Must render iframe for Google Drive');
assert.ok(gdHtml.includes('drive.google.com/file/d/12345ABCDE/preview'), 'Must convert view to preview');

// 4. Sanitization test
const dirty = ytHtml + '<script>alert(1)</script>';
const clean = SelfStudyMedia.sanitizeMediaContent(dirty);
assert.ok(clean.includes('iframe'), 'Sanitized HTML must keep iframe');
assert.ok(!clean.includes('<script>'), 'Sanitized HTML must strip dangerous scripts');

console.log('[PASS] Dynamic Stepper & Universal Video Embeds verified successfully!');
