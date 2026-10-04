// tests/test_gateway_self_study_api.js
const http = require('http');
const assert = require('assert');
const path = require('path');

console.log('[TEST] Checking Gateway Self-Study APIs...');

// Start the gateway server
const serverPath = path.resolve(__dirname, '../teacher_suite/gateway/server.js');
const { webServer, agentServer } = require(serverPath);

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  try {
    // Wait briefly for server ready
    await new Promise(r => setTimeout(r, 500));

    // Test 1: GET /api/self-study/manifest
    console.log('Testing GET /api/self-study/manifest...');
    const res1 = await request({
      hostname: '127.0.0.1',
      port: 49150,
      path: '/api/self-study/manifest',
      method: 'GET'
    });
    assert.strictEqual(res1.status, 200, 'Manifest must return 200');
    assert.ok(Array.isArray(res1.data.grades), 'Manifest must have grades');

    // Test 2: GET /api/self-study/lesson?id=tin6_bai12
    console.log('Testing GET /api/self-study/lesson?id=tin6_bai12...');
    const res2 = await request({
      hostname: '127.0.0.1',
      port: 49150,
      path: '/api/self-study/lesson?id=tin6_bai12',
      method: 'GET'
    });
    assert.strictEqual(res2.status, 200, 'Lesson must return 200');
    assert.strictEqual(res2.data.id, 'tin6_bai12', 'Lesson id must match');

    // Test 3: POST /api/self-study/progress (from student desk without CSRF)
    console.log('Testing POST /api/self-study/progress...');
    const res3 = await request({
      hostname: '127.0.0.1',
      port: 49150,
      path: '/api/self-study/progress',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      deskId: 'MAY-05',
      studentName: 'Tran Van B',
      lessonId: 'tin6_bai12',
      step: 3,
      score: '10/10',
      completed: true
    });
    assert.strictEqual(res3.status, 200, 'Progress reporting must return 200');
    assert.strictEqual(res3.data.success, true);

    // Test 4: GET /api/self-study/live-progress
    console.log('Testing GET /api/self-study/live-progress...');
    const res4 = await request({
      hostname: '127.0.0.1',
      port: 49150,
      path: '/api/self-study/live-progress',
      method: 'GET'
    });
    assert.strictEqual(res4.status, 200, 'Live progress must return 200');
    assert.ok(res4.data.desks && res4.data.desks['MAY-05'], 'Desk MAY-05 must be recorded in live progress');
    assert.strictEqual(res4.data.desks['MAY-05'].step, 3);

    // Test 5: POST & GET /api/self-study/teacher-control
    console.log('Testing teacher control...');
    const res5 = await request({
      hostname: '127.0.0.1',
      port: 49150,
      path: '/api/self-study/teacher-control',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      lockAll: true,
      maxStep: 2
    });
    assert.strictEqual(res5.status, 200, 'Teacher control update must return 200');

    const res6 = await request({
      hostname: '127.0.0.1',
      port: 49150,
      path: '/api/self-study/teacher-control',
      method: 'GET'
    });
    assert.strictEqual(res6.status, 200, 'Teacher control GET must return 200');
    assert.strictEqual(res6.data.lockAll, true);
    assert.strictEqual(res6.data.maxStep, 2);

    console.log('[PASS] All Gateway Self-Study APIs verified successfully!');
    process.exit(0);
  } finally {
    webServer.close();
    agentServer.close();
  }
}

run().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
