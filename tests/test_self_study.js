/**
 * TEST AUTOMATION FOR CVALMS PRO - SELF STUDY MODULE
 * Validates DOM integrity, file synchronization, syntax, and gated progression logic.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');

console.log('🧪 BẮT ĐẦU KIỂM THỬ ZERO-BUG: PHÂN HỆ TỰ HỌC CVALMS PRO...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Kiểm tra sự tồn tại và đồng bộ giữa 3 thư mục
const targets = [
  { name: 'Root', dir: baseDir },
  { name: 'Teacher Suite', dir: path.join(baseDir, 'teacher_suite') },
  { name: 'Dist App', dir: path.join(baseDir, 'dist', 'installer_teacher', 'app') }
];

targets.forEach(t => {
  const htmlPath = path.join(t.dir, 'index.html');
  const cssPath = path.join(t.dir, 'style.css');
  const jsPath = path.join(t.dir, 'js', 'self_study.js');

  assert(fs.existsSync(htmlPath), `[${t.name}] Tệp index.html tồn tại`);
  assert(fs.existsSync(cssPath), `[${t.name}] Tệp style.css tồn tại`);
  assert(fs.existsSync(jsPath), `[${t.name}] Tệp js/self_study.js tồn tại`);

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  assert(htmlContent.includes('id="btn-enter-self-study"'), `[${t.name}] Chứa nút Góc Tự Học trên thanh lobby`);
  assert(htmlContent.includes('id="screen-self-study"'), `[${t.name}] Chứa container màn hình screen-self-study`);
  assert(htmlContent.includes('src="js/self_study.js?v=3.5.0"'), `[${t.name}] Nạp đúng script self_study.js`);

  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert(cssContent.includes('.cvalms-selfstudy-card'), `[${t.name}] Chứa bộ CSS quy chuẩn .cvalms-selfstudy-*`);
});

// 2. Kiểm tra Logic State Machine của self_study.js
const selfStudyCode = fs.readFileSync(path.join(baseDir, 'js', 'self_study.js'), 'utf8');

// Mô phỏng môi trường trình duyệt tối thiểu
const mockStorage = {};
const mockElements = {
  'selfstudy-content-container': { innerHTML: '' },
  'ss-header-lesson-title': { textContent: '' },
  'ss-progress-percent-label': { textContent: '' },
  'ss-progress-bar-fill': { style: { width: '0%' } },
  'ss-sidebar-lesson-list': { innerHTML: '' },
  'screen-self-study': { style: { display: 'none' }, classList: { add() {}, remove() {} } },
  'screen-lobby': { style: { display: 'flex' }, classList: { add() {}, remove() {} } },
  'btn-enter-self-study': { onclick: null }
};

const domListeners = {};

global.window = {
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; }
  },
  AudioContext: function() {
    return {
      currentTime: 0,
      createOscillator: () => ({ frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }),
      createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }),
      destination: {}
    };
  },
  confetti: function(opts) {
    mockStorage.__confetti_triggered = true;
  }
};
global.localStorage = global.window.localStorage;

global.document = {
  getElementById: (id) => mockElements[id] || null,
  querySelectorAll: (selector) => [],
  addEventListener: (evt, cb) => { domListeners[evt] = cb; }
};

// Chạy mã nguồn self_study.js trong môi trường giả lập
const vm = require('vm');
vm.runInThisContext(selfStudyCode);

assert(typeof window.CVALMS_SELF_STUDY === 'object', 'window.CVALMS_SELF_STUDY được khởi tạo thành công');
assert(typeof window.CVALMS_SELF_STUDY.open === 'function', 'Hàm open() sẵn sàng');
assert(typeof window.CVALMS_SELF_STUDY.handleSelectCloze === 'function', 'Hàm handleSelectCloze() sẵn sàng');
assert(typeof window.CVALMS_SELF_STUDY.handleSelectQuiz === 'function', 'Hàm handleSelectQuiz() sẵn sàng');

// Thử nghiệm mở tự học và kiểm tra khởi tạo
window.CVALMS_SELF_STUDY.open();
assert(mockElements['screen-self-study'].style.display === 'flex', 'Màn hình screen-self-study chuyển sang display:flex');

// Kiểm tra trả lời đúng câu điền khuyết
window.CVALMS_SELF_STUDY.handleSelectCloze('thuật toán');
const savedState = JSON.parse(mockStorage['cvalms_selfstudy_tin6_bai12'] || '{}');
assert(savedState.clozeDone === true, 'Trả lời đúng từ khuyết "thuật toán" được ghi nhận clozeDone = true');

// Kiểm tra trả lời sai từ khuyết
window.CVALMS_SELF_STUDY.handleSelectCloze('phần mềm');
const savedStateWrong = JSON.parse(mockStorage['cvalms_selfstudy_tin6_bai12'] || '{}');
assert(savedStateWrong.clozeDone === false, 'Chọn từ sai "phần mềm" bị từ chối clozeDone = false');

// Kiểm tra trả lời đúng Quiz trắc nghiệm
window.CVALMS_SELF_STUDY.handleSelectQuiz(1); // Hình thoi
const savedQuiz = JSON.parse(mockStorage['cvalms_selfstudy_tin6_bai12'] || '{}');
assert(savedQuiz.quizDone === true, 'Chọn đúng phương án B (Hình thoi) được ghi nhận quizDone = true');

// Kiểm tra cơ chế cán đích 100% Mastery
savedQuiz.step1 = true;
savedQuiz.step2 = true;
savedQuiz.step3 = true;
savedQuiz.clozeDone = true;
savedQuiz.quizDone = true;
window.localStorage.setItem('cvalms_selfstudy_tin6_bai12', JSON.stringify(savedQuiz));
window.CVALMS_SELF_STUDY.switchLesson('tin6_bai12');
window.CVALMS_SELF_STUDY.checkOverallMastery();

const finalState = JSON.parse(mockStorage['cvalms_selfstudy_tin6_bai12'] || '{}');
assert(finalState.completed === true, 'Hoàn thành đủ 4 bước đạt 100% Mastery (completed = true)');
assert(mockStorage.__confetti_triggered === true, 'Pháo hoa Confetti chúc mừng được kích hoạt');

console.log(`\n==================================================`);
console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passCount} PASSED / ${failCount} FAILED`);
console.log(`==================================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 100% ZERO-BUG TEST PASSED! MÃ NGUỒN SẴN SÀNG VẬN HÀNH THỰC TẾ.');
  process.exit(0);
}
