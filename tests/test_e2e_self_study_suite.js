// tests/test_e2e_self_study_suite.js
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log('🚀 CVALMS PRO - BỘ KIỂM THỬ TỰ HỌC TOÀN DIỆN (E2E)');
console.log('====================================================\n');

const testFiles = [
  'tests/test_lesson_schema.js',
  'tests/test_gateway_self_study_api.js',
  'tests/test_self_study_engine.js',
  'tests/test_self_study_editor.js',
  'tests/test_self_study_monitor.js'
];

let allPassed = true;

for (const tf of testFiles) {
  const fullPath = path.resolve(__dirname, '..', tf);
  console.log(`▶ Đang chạy: ${tf}...`);
  const res = spawnSync('node', [fullPath], { encoding: 'utf8', timeout: 15000 });
  if (res.status === 0) {
    console.log(`  ✅ PASS: ${tf}`);
  } else {
    console.error(`  ❌ FAIL: ${tf}`);
    console.error(res.stderr || res.stdout);
    allPassed = false;
  }
}

// Kiểm tra 18 máy trạm ảo gửi đồng thời
console.log('\n▶ Kiểm thử giả lập 18 máy trạm gửi tiến trình đồng thời...');
const SelfStudyMonitor = require(path.resolve(__dirname, '../js/self_study_monitor.js'));
const monitor = new SelfStudyMonitor();

const virtualDesks = {};
for (let i = 1; i <= 18; i++) {
  const deskId = `MAY-${String(i).padStart(2, '0')}`;
  virtualDesks[deskId] = {
    deskId,
    studentName: `Học sinh ${i}`,
    lessonId: 'tin6_bai12',
    step: (i % 4) + 1,
    score: `${8 + (i % 3)}/10`,
    completed: i % 2 === 0,
    updatedAt: Date.now()
  };
}

const merged = monitor.mergeLiveProgress({ desks: virtualDesks });
const csv = monitor.generateProgressCSV(merged);

if (Object.keys(merged).length === 18 && csv.includes('MAY-18') && csv.includes('Học sinh 18')) {
  console.log('  ✅ 18 máy trạm đã tổng hợp dữ liệu thành công!');
} else {
  console.error('  ❌ Lỗi tổng hợp 18 máy trạm!');
  allPassed = false;
}

if (!allPassed) {
  console.error('\n❌ Có kiểm thử thất bại!');
  process.exit(1);
} else {
  console.log('\n====================================================');
  console.log('🎉 TOÀN BỘ CÁC BÀI TEST TỰ HỌC ĐÃ VƯỢT QUA 100%!');
  console.log('====================================================');
  process.exit(0);
}
