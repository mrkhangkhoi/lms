// tests/test_self_study_media.js
const assert = require('assert');
const path = require('path');

console.log('[TEST] Checking Universal Media Engine (self_study_media.js)...');

let SelfStudyMedia;
try {
  SelfStudyMedia = require(path.resolve(__dirname, '../js/self_study_media.js'));
} catch (e) {
  // Expected to fail before module created
}

assert.ok(SelfStudyMedia, 'SelfStudyMedia must be defined and exportable');

// 1. YouTube standard URL
const yt1 = SelfStudyMedia.parseMediaSource('https://www.youtube.com/watch?v=k4S_f3p82kM');
assert.strictEqual(yt1.type, 'youtube');
assert.strictEqual(yt1.id, 'k4S_f3p82kM');
assert.ok(yt1.embedUrl.includes('embed/k4S_f3p82kM'));

// 2. YouTube mobile share with query params
const yt2 = SelfStudyMedia.parseMediaSource('https://youtu.be/k4S_f3p82kM?si=AbCdEfGhIjK&t=15s');
assert.strictEqual(yt2.type, 'youtube');
assert.strictEqual(yt2.id, 'k4S_f3p82kM');

// 3. YouTube Shorts URL
const yt3 = SelfStudyMedia.parseMediaSource('https://www.youtube.com/shorts/AbCdEfGh123');
assert.strictEqual(yt3.type, 'youtube');
assert.strictEqual(yt3.id, 'AbCdEfGh123');

// 4. Google Drive URL
const gd1 = SelfStudyMedia.parseMediaSource('https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing');
assert.strictEqual(gd1.type, 'gdrive');
assert.strictEqual(gd1.embedUrl, 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/preview');

// 5. Direct MP4 video (LAN or Web)
const mp4 = SelfStudyMedia.parseMediaSource('http://192.168.1.100:49150/videos/tin6_bai1.mp4');
assert.strictEqual(mp4.type, 'direct_video');
assert.strictEqual(mp4.embedUrl, 'http://192.168.1.100:49150/videos/tin6_bai1.mp4');

// 6. Image URL
const img = SelfStudyMedia.parseMediaSource('assets/img/tin6_flowchart.png');
assert.strictEqual(img.type, 'image');

// 7. Validate helper
const v1 = SelfStudyMedia.validateMediaUrl('https://www.youtube.com/watch?v=k4S_f3p82kM');
assert.strictEqual(v1.ok, true);
assert.strictEqual(v1.type, 'youtube');

const v2 = SelfStudyMedia.validateMediaUrl('');
assert.strictEqual(v2.ok, false);

const v3 = SelfStudyMedia.validateMediaUrl('not-a-valid-url-xyz');
assert.strictEqual(v3.ok, false);

// 8. Render HTML
const htmlYt = SelfStudyMedia.renderMediaHtml({ type: 'video', url: 'https://youtu.be/k4S_f3p82kM', caption: 'Test Video' });
assert.ok(htmlYt.includes('<iframe'), 'YouTube must render iframe');
assert.ok(htmlYt.includes('k4S_f3p82kM'), 'Must contain YouTube ID');

const htmlMp4 = SelfStudyMedia.renderMediaHtml({ type: 'video', url: 'videos/bai1.mp4', caption: 'Local Video' });
assert.ok(htmlMp4.includes('<video'), 'Direct video must render video tag');

console.log('[PASS] Universal Media Engine tests passed!');
