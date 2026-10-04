// tests/test_self_study_monitor.js
const assert = require('assert');
const path = require('path');

console.log('[TEST] Checking Self-Study Monitor Logic...');

let SelfStudyMonitor;
try {
  SelfStudyMonitor = require(path.resolve(__dirname, '../js/self_study_monitor.js'));
} catch (e) {
  // Expected before file created
}

assert.ok(SelfStudyMonitor, 'SelfStudyMonitor must be defined');

const monitor = new SelfStudyMonitor({
  gatewayUrl: 'http://127.0.0.1:49150'
});

// 1. Initial State: 18 desks template
const desksGrid = monitor.getDesksTemplate();
assert.strictEqual(Object.keys(desksGrid).length, 18, 'Must have 18 desks (MAY-01 to MAY-18)');
assert.ok(desksGrid['MAY-01'], 'MAY-01 must exist');
assert.ok(desksGrid['MAY-18'], 'MAY-18 must exist');

// 2. Merge Live State
const liveState = {
  desks: {
    'MAY-05': {
      deskId: 'MAY-05',
      studentName: 'Nguyen Van A',
      lessonId: 'tin6_bai12',
      step: 3,
      score: '9/10',
      completed: false,
      updatedAt: Date.now()
    }
  }
};

const merged = monitor.mergeLiveProgress(liveState);
assert.strictEqual(merged['MAY-05'].studentName, 'Nguyen Van A');
assert.strictEqual(merged['MAY-05'].step, 3);
assert.strictEqual(merged['MAY-01'].status, 'offline');

// 3. Export CSV/Excel format generator
const csv = monitor.generateProgressCSV(merged);
assert.ok(csv.includes('MAY-05'));
assert.ok(csv.includes('Nguyen Van A'));
assert.ok(csv.includes('tin6_bai12'));
assert.ok(csv.includes('9/10'));

console.log('[PASS] SelfStudyMonitor logic verified successfully!');
