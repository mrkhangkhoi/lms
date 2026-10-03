const http = require('http');
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateCerts, certsDir } = require('./generate_certs');
const { sendWakeOnLan } = require('./wol');
const { DurableCollectionStorage, logAuditAction } = require('./storage');

// 1. Khởi tạo chứng chỉ nếu chưa có
generateCerts();

const WEB_PORT = 49150;
const AGENT_MTLS_PORT = 49152;

// 2. Session Epoch & Security Tokens
const SESSION_EPOCH_ID = crypto.randomUUID();
const CSRF_TOKEN = crypto.randomBytes(16).toString('hex');
const STORAGE = new DurableCollectionStorage();

// 2.1 Teacher Authentication & RFC1918 Private LAN Verification
const TEACHER_PASSWORD_HASHES = new Set([
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
  '33c39cf33ac4a48e2fb588c2fbb99092043744f685a6f5c8d91c8f554139604b'  // cvalms2026
]);
const ACTIVE_TEACHER_SESSIONS = new Map(); // token -> { ip, createdAt }

function isLocalOrLanIp(rawIp) {
  if (!rawIp) return false;
  const ip = rawIp.replace(/^::ffff:/, '').trim();
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;

  // RFC 1918: 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;

  // RFC 1918: 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  const m172 = ip.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (m172) {
    const second = parseInt(m172[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  // RFC 1918: 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;

  // Link-Local: 169.254.0.0/16
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;

  // IPv6 Link-Local / Unique-Local
  if (/^fe80:/i.test(ip) || /^fc00:/i.test(ip) || /^fd[0-9a-f]{2}:/i.test(ip)) return true;

  return false;
}

function isLocalhost(rawIp) {
  if (!rawIp) return false;
  const ip = rawIp.replace(/^::ffff:/, '').trim();
  return (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost');
}

function isTrustedOrigin(originHeader) {
  if (!originHeader) return true;
  try {
    const u = new URL(originHeader);
    return isLocalOrLanIp(u.hostname) || u.hostname === 'localhost';
  } catch (e) {
    return false;
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('🏛️  CVALMS LAB GATEWAY / LOCAL CONTROLLER (v3.5.0 ENTERPRISE SPEC)');
console.log(`🔑 Session Epoch ID: ${SESSION_EPOCH_ID}`);
console.log(`🛡️  CSRF Token: ${CSRF_TOKEN}`);
console.log('═══════════════════════════════════════════════════════════════');

// 3. Trạng thái các máy trạm trong phòng máy THCS (Mặc định chuẩn 18 máy, hỗ trợ mở rộng động 18-48 máy qua biến môi trường CVALMS_SEATS)
const DEFAULT_SEATS = 18;
const parsedSeats = parseInt(process.env.CVALMS_SEATS || '18', 10);
const TOTAL_SEATS = (Number.isInteger(parsedSeats) && parsedSeats >= 18 && parsedSeats <= 48) ? parsedSeats : DEFAULT_SEATS;
const SEATS = {};
for (let i = 1; i <= TOTAL_SEATS; i++) {
  const id = `MAY-${String(i).padStart(2, '0')}`;
  SEATS[id] = {
    id,
    name: `Máy ${String(i).padStart(2, '0')}`,
    seatIndex: i,
    online: false,
    ip: null,
    mac: `00:11:22:33:44:${String(i).padStart(2, '0')}`,
    lastSeen: 0,
    screenState: 'OFFLINE', // 'ONLINE' | 'OFFLINE' | 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED' | 'LOCKED'
    currentApp: 'Chưa có dữ liệu',
    isSpotlight: false,
    latestFrame: null,
    sequenceNumber: 0,
    socket: null
  };
}

let activeSpotlightMachine = null;
let isTeacherBroadcasting = false;
const webSockets = new Set();

// 4. Máy chủ mTLS cho C# Agent (Port 49152)
const tlsOptions = {
  key: fs.readFileSync(path.join(certsDir, 'gateway.key')),
  cert: fs.readFileSync(path.join(certsDir, 'gateway.crt')),
  ca: fs.readFileSync(path.join(certsDir, 'ca.crt')),
  requestCert: true,
  rejectUnauthorized: true
};

const agentServer = tls.createServer(tlsOptions, (socket) => {
  let authenticatedMachineId = null;
  let buffer = Buffer.alloc(0);
  let lastDataTime = Date.now();
  let frameStartTime = 0;

  // Incomplete frame timeout monitor (10s không hoàn tất frame -> hủy socket chống Slow-Loris DoS)
  const frameTimeoutCheck = setInterval(() => {
    if (frameStartTime > 0 && Date.now() - frameStartTime > 10000) {
      console.warn(`⚠️ [Slow Frame DoS Alert] Socket ${authenticatedMachineId || 'Unknown'} truyền frame dang dở quá 10s. Đang đóng kết nối phòng vệ.`);
      clearInterval(frameTimeoutCheck);
      socket.destroy();
      return;
    }
    if (Date.now() - lastDataTime > 30000) {
      console.warn(`⚠️ [Inactive Socket Timeout] Socket ${authenticatedMachineId || 'Unknown'} không hoạt động 30s. Đóng kết nối.`);
      clearInterval(frameTimeoutCheck);
      socket.destroy();
    }
  }, 3000);

  if (!socket.authorized) {
    console.warn(`⚠️ Client không được chứng thực mTLS: ${socket.authorizationError}`);
  } else {
    console.log('🔒 Client mTLS kết nối thành công và được xác thực hợp lệ!');
  }

  socket.on('data', (chunk) => {
    lastDataTime = Date.now();
    // Giới hạn Buffer phòng vệ chống tràn bộ nhớ và tấn công DoS (Max 15MB)
    if (buffer.length + chunk.length > 15 * 1024 * 1024) {
      console.warn(`⚠️ [Buffer Overflow Protection] Agent socket ${authenticatedMachineId || 'Unknown'} vượt quá 15MB. Đang ngắt kết nối phòng vệ.`);
      clearInterval(frameTimeoutCheck);
      socket.destroy();
      return;
    }

    buffer = Buffer.concat([buffer, chunk]);

    // Xử lý gói tin nhị phân hoặc JSON framing
    while (buffer.length >= 4) {
      const magic = buffer.readUInt32BE(0);

      // Gói tin Đăng ký / Trạng thái JSON (Magic: 0x4356414C = 'CVAL')
      if (magic === 0x4356414C) {
        if (buffer.length < 8) break;
        const jsonLen = buffer.readUInt32BE(4);
        if (jsonLen > 64 * 1024) { // Max JSON 64KB
          console.warn(`⚠️ [JSON Size Exceeded] jsonLen=${jsonLen} vượt quá 64KB. Đóng socket.`);
          clearInterval(frameTimeoutCheck);
          socket.destroy();
          return;
        }
        if (buffer.length < 8 + jsonLen) break;

        const jsonBuf = buffer.slice(8, 8 + jsonLen);
        buffer = buffer.slice(8 + jsonLen);

        try {
          const msg = JSON.parse(jsonBuf.toString('utf8'));
          handleAgentMessage(msg, socket, (mId) => { authenticatedMachineId = mId; });
        } catch (err) {
          console.warn('⚠️ Lỗi giải mã JSON agent:', err.message);
        }
      }
      // Gói tin Khung hình màn hình Binary Frame (Magic: 0x43564652 = 'CVFR')
      else if (magic === 0x43564652) {
        if (frameStartTime === 0) {
          frameStartTime = Date.now();
        }

        // Header: Magic(4B) + MachineIdLen(1B) + MachineId(str) + Seq(4B) + Time(8B) + Width(2B) + Height(2B) + State(1B) + PayloadLen(4B)
        if (buffer.length < 5) break;
        const mIdLen = buffer.readUInt8(4);
        if (mIdLen < 1 || mIdLen > 64) {
          console.warn(`⚠️ [Invalid MachineId Len] mIdLen=${mIdLen}. Đóng socket.`);
          clearInterval(frameTimeoutCheck);
          socket.destroy();
          return;
        }

        const headerLen = 5 + mIdLen + 4 + 8 + 2 + 2 + 1 + 4;
        if (buffer.length < headerLen) break;

        const machineId = buffer.slice(5, 5 + mIdLen).toString('utf8');
        if (!/^[a-zA-Z0-9_\-\.]+$/.test(machineId)) {
          console.warn(`⚠️ [Invalid MachineId Format] machineId=${machineId}. Đóng socket.`);
          clearInterval(frameTimeoutCheck);
          socket.destroy();
          return;
        }

        let offset = 5 + mIdLen;
        const seq = buffer.readUInt32BE(offset); offset += 4;
        const ts = Number(buffer.readBigUInt64BE(offset)); offset += 8;
        const width = buffer.readUInt16BE(offset); offset += 2;
        const height = buffer.readUInt16BE(offset); offset += 2;
        const stateCode = buffer.readUInt8(offset); offset += 1;
        const payloadLen = buffer.readUInt32BE(offset); offset += 4;

        if (payloadLen > 10 * 1024 * 1024) { // Max JPEG frame 10MB
          console.warn(`⚠️ [Frame Payload Too Large] payloadLen=${payloadLen}. Đóng socket.`);
          clearInterval(frameTimeoutCheck);
          socket.destroy();
          return;
        }

        if (buffer.length < headerLen + payloadLen) break;

        const jpegPayload = buffer.slice(headerLen, headerLen + payloadLen);
        buffer = buffer.slice(headerLen + payloadLen);
        frameStartTime = 0; // Đã nhận trọn vẹn frame thành công

        // KIỂM TRA ĐỐI CHIẾU DANH TÍNH MÁY TRONG FRAME VỚI SESSION ĐÃ XÁC THỰC (Finding #8)
        if (authenticatedMachineId && machineId !== authenticatedMachineId) {
          console.warn(`🚨 [Frame Identity Spoofing] Socket đã xác thực ${authenticatedMachineId} nhưng cố tình gửi frame mạo danh ${machineId}. Hủy socket!`);
          clearInterval(frameTimeoutCheck);
          socket.destroy();
          return;
        }

        handleAgentFrame(machineId, seq, ts, width, height, stateCode, jpegPayload);
      }
      // Gói tin Thu bài Stream Data (Magic: 0x43565355 = 'CVSU')
      else if (magic === 0x43565355) {
        if (buffer.length < 12) break;
        const subIdLen = buffer.readUInt32BE(4);
        const dataLen = buffer.readUInt32BE(8);

        if (subIdLen < 1 || subIdLen > 128 || dataLen > 50 * 1024 * 1024) {
          console.warn(`⚠️ [Invalid CVSU Frame] subIdLen=${subIdLen}, dataLen=${dataLen}. Đóng socket.`);
          clearInterval(frameTimeoutCheck);
          socket.destroy();
          return;
        }

        if (buffer.length < 12 + subIdLen + dataLen) break;

        const submissionId = buffer.slice(12, 12 + subIdLen).toString('utf8');
        const zipPayload = buffer.slice(12 + subIdLen, 12 + subIdLen + dataLen);
        buffer = buffer.slice(12 + subIdLen + dataLen);

        handleSubmissionUpload(submissionId, zipPayload, socket);
      } else {
        // Dịch chuyển 1 byte để tìm magic tiếp theo
        buffer = buffer.slice(1);
      }
    }
  });

  socket.on('close', () => {
    clearInterval(frameTimeoutCheck);
    if (authenticatedMachineId && SEATS[authenticatedMachineId]) {
      const seat = SEATS[authenticatedMachineId];
      seat.online = false;
      seat.screenState = 'OFFLINE';
      seat.socket = null;
      broadcastSeatStatus(seat);
    }
  });

  socket.on('error', (err) => {
    console.warn(`[Agent Socket Error] ${authenticatedMachineId || 'Unknown'}:`, err.message);
  });
});

agentServer.on('tlsClientError', (err) => {
  console.warn(`[mTLS Handshake Error]: ${err.message}`);
});

function handleAgentMessage(msg, socket, setMachineId) {
  if (msg.type === 'REGISTER') {
    const mId = msg.machineId;
    if (!mId || !SEATS[mId]) {
      console.warn(`⚠️ [Security Alert] MachineId không hợp lệ hoặc nằm ngoài danh sách: ${mId}`);
      socket.destroy();
      return;
    }

    // Xác thực định danh chứng chỉ mTLS nghiêm ngặt (Certificate-to-Seat Binding)
    try {
      const peerCert = socket.getPeerCertificate ? socket.getPeerCertificate() : null;
      if (peerCert && peerCert.subject) {
        const cn = (peerCert.subject.CN || '').trim();
        const lowerCn = cn.toLowerCase();
        const issuerCn = (peerCert.issuer && peerCert.issuer.CN) || '';

        // Bắt buộc Issuer phải từ Root CA chính thức của hệ thống CvaLms
        if (!issuerCn.toLowerCase().includes('cvalms')) {
          console.warn(`🚨 [Untrusted CA] Chứng chỉ không được phát hành bởi CvaLms CA: Issuer=${issuerCn}. Hủy kết nối.`);
          socket.destroy();
          return;
        }

        // Nếu chứng chỉ theo mẫu từng máy (CN = MAY-xx) thì BẮT BUỘC phải khớp 100% với mId
        if (/^MAY-\d+$/i.test(cn)) {
          if (cn.toUpperCase() !== mId.toUpperCase()) {
            console.warn(`🚨 [Certificate-to-Seat Binding Mismatch] Chứng chỉ máy ${cn} cố tình đăng ký ID=${mId}. Hủy kết nối phòng vệ.`);
            socket.destroy();
            return;
          }
        } else {
          // Chứng chỉ chung của phòng máy CVALMS-Student-Agent
          const isOfficialAgentCert = lowerCn.includes('cvalms') && lowerCn.includes('agent');
          if (!isOfficialAgentCert) {
            console.warn(`🚨 [Invalid Agent Cert] CN chứng chỉ không hợp lệ: ${cn}. Hủy kết nối.`);
            socket.destroy();
            return;
          }
        }
        console.log(`🔒 [mTLS Verified] Máy ${mId} xác thực thành công qua chứng chỉ: CN=${cn}, Issuer=${issuerCn}`);
      }
    } catch (err) {
      console.warn(`[PeerCert Warning]: ${err?.message || err}`);
      socket.destroy();
      return;
    }

    setMachineId(mId);
    const seat = SEATS[mId];

    // Thu hồi kết nối cũ an toàn chống socket hijacking nếu máy đang online
    if (seat.socket && seat.socket !== socket && seat.online) {
      try { seat.socket.destroy(); } catch (e) { console.warn('[Socket Cleanup Warning]:', e.message); }
    }

    seat.online = true;
    seat.ip = socket.remoteAddress;
    seat.lastSeen = Date.now();
    seat.screenState = 'ONLINE';
    seat.currentApp = msg.foregroundApp || 'LMS';
    seat.sequenceNumber = 0; // Reset sequence counter cho phiên làm việc mới
    seat.socket = socket;
    seat.mac = msg.macAddress || seat.mac;

    // Phản hồi SESSION_INIT kèm EpochId (Không phát tán CSRF token cho agent học sinh)
    const reply = Buffer.from(JSON.stringify({
      type: 'SESSION_INIT',
      sessionEpochId: SESSION_EPOCH_ID,
      spotlight: (activeSpotlightMachine === mId)
    }), 'utf8');
    const header = Buffer.alloc(8);
    header.writeUInt32BE(0x4356414C, 0);
    header.writeUInt32BE(reply.length, 4);
    socket.write(Buffer.concat([header, reply]));

    broadcastSeatStatus(seat);
  } else if (msg.type === 'HEARTBEAT') {
    const mId = msg.machineId;
    if (SEATS[mId]) {
      const seat = SEATS[mId];
      seat.lastSeen = Date.now();
      seat.currentApp = msg.foregroundApp || seat.currentApp;
      if (msg.screenState) seat.screenState = msg.screenState;
      broadcastSeatStatus(seat);
    }
  } else if (msg.type === 'STATE_CHANGE') {
    const mId = msg.machineId;
    if (SEATS[mId]) {
      const seat = SEATS[mId];
      seat.screenState = msg.screenState;
      broadcastSeatStatus(seat);
    }
  } else if (msg.type === 'COLLECT_SUBMIT') {
    STORAGE.createTransaction(msg.submissionId, msg.machineId, msg.studentName, msg.expectedHash, msg.sessionEpochId);
    console.log(`📝 Đã đăng ký giao dịch nộp bài [${msg.submissionId}] từ máy ${msg.machineId}`);
  }
}

function handleAgentFrame(machineId, seq, ts, width, height, stateCode, jpegPayload) {
  const seat = SEATS[machineId];
  if (!seat) return;

  // Replay Attack Protection: Gói tin phải có sequence number tăng dần
  if (seq <= seat.sequenceNumber) {
    // Bỏ qua khung hình cũ / lặp lại
    return;
  }

  seat.online = true;
  seat.lastSeen = Date.now();
  seat.sequenceNumber = seq;

  if (stateCode === 1) {
    seat.screenState = 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED';
  } else if (seat.screenState === 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED') {
    seat.screenState = 'ONLINE';
  }

  // Ring Buffer = 1 (Latest-Frame-Wins)
  seat.latestFrame = {
    machineId,
    seq,
    ts,
    width,
    height,
    state: seat.screenState,
    jpegBase64: jpegPayload.toString('base64')
  };

  // Phát frame tới các trình duyệt Web LMS đang kết nối
  broadcastFrame(seat.latestFrame);
}

function handleSubmissionUpload(submissionId, zipPayload, socket) {
  try {
    const tx = STORAGE.getSubmissionStatus(submissionId);
    if (!tx) {
      throw new Error('Giao dịch chưa được đăng ký chuẩn bị');
    }
    const result = STORAGE.commitSubmission(submissionId, zipPayload, tx.expectedHash);

    // Gửi COMMIT_ACK kèm mã băm SHA-256 xác thực 2 đầu
    const ack = Buffer.from(JSON.stringify({
      type: 'COMMIT_ACK',
      submissionId,
      status: 'COMMITTED',
      savedFile: result.savedFile,
      contentHash: result.contentHash
    }), 'utf8');
    const header = Buffer.alloc(8);
    header.writeUInt32BE(0x4356414C, 0);
    header.writeUInt32BE(ack.length, 4);
    socket.write(Buffer.concat([header, ack]));

    broadcastWebLms({
      type: 'SUBMISSION_COMMITTED',
      submission: tx
    });
  } catch (err) {
    console.error('❌ Lỗi commit bài tập:', err.message);
    const nack = Buffer.from(JSON.stringify({
      type: 'COMMIT_NACK',
      submissionId,
      status: 'FAILED',
      error: err.message
    }), 'utf8');
    const header = Buffer.alloc(8);
    header.writeUInt32BE(0x4356414C, 0);
    header.writeUInt32BE(nack.length, 4);
    try { socket.write(Buffer.concat([header, nack])); } catch (wErr) { console.warn('[Socket Nack Write Error]:', wErr.message); }
  }
}

// 5. Máy chủ Web HTTP & WebSocket cho Web LMS Giáo viên (Port 49150)
const webServer = http.createServer((req, res) => {
  // CORS & Origin Protection
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CVALMS-CSRF-Token, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // API Quản trị & Điều khiển CVALMS
  if (url.pathname === '/api/status' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ONLINE',
      gatewayTime: Date.now(),
      epoch: SESSION_EPOCH_ID,
      activeSpotlight: activeSpotlightMachine,
      seats: Object.values(SEATS).map(s => ({
        id: s.id,
        name: s.name,
        ip: s.ip,
        online: s.online,
        screenState: s.screenState,
        currentApp: s.currentApp,
        isSpotlight: s.isSpotlight,
        lastSeen: s.lastSeen
      }))
    });
    return;
  }

  // Parse POST body helper
  function readBody(callback) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        callback(null, parsed);
      } catch (e) {
        callback(e);
      }
    });
  }

  // Kiểm tra CSRF cho các thao tác tác động phần cứng
  function verifyCsrf(headers) {
    const token = headers['x-cvalms-csrf-token'];
    return (token === CSRF_TOKEN);
  }

  const remoteIp = req.socket.remoteAddress || '';
  const isLocal = isLocalhost(remoteIp);
  const isLanOrLocal = isLocalOrLanIp(remoteIp);

  // 1. Endpoint Đăng nhập Giáo viên từ xa qua mạng LAN
  if (url.pathname === '/api/auth/teacher-login' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const pwd = (data && data.password) || '';
      const pwdHash = (data && data.passwordHash) || (pwd ? crypto.createHash('sha256').update(pwd).digest('hex') : '');
      if (TEACHER_PASSWORD_HASHES.has(pwdHash)) {
        const teacherToken = crypto.randomBytes(24).toString('hex');
        ACTIVE_TEACHER_SESSIONS.set(teacherToken, { ip: remoteIp, createdAt: Date.now() });
        console.log(`🔑 [Teacher Auth] Giáo viên đã đăng nhập thành công từ IP: ${remoteIp}`);
        return sendJson(res, 200, {
          success: true,
          teacherToken,
          csrfToken: CSRF_TOKEN,
          epoch: SESSION_EPOCH_ID
        });
      }
      console.warn(`🚨 [Teacher Auth Failure] Đăng nhập thất bại từ IP ${remoteIp}: Sai mật khẩu`);
      return sendJson(res, 401, { error: 'Unauthorized', message: 'Mật khẩu Giáo viên không chính xác!' });
    });
    return;
  }

  // 2. Endpoint cấp CSRF Token chính thống cho giao diện Web LMS (Cho phép Localhost và mạng LAN trường học)
  if (url.pathname === '/api/csrf' && req.method === 'GET') {
    if (!isLanOrLocal) {
      console.warn(`🚨 [Security Alert] Chặn thiết bị ngoài mạng công cộng (${remoteIp}) lấy CSRF Token!`);
      return sendJson(res, 403, { error: 'Forbidden: Access denied from external network.' });
    }
    return sendJson(res, 200, { csrfToken: CSRF_TOKEN, epoch: SESSION_EPOCH_ID, isLocalhost: isLocal });
  }

  // 3. Chốt chặn bảo vệ các API quản trị POST
  if (url.pathname.startsWith('/api/') && req.method === 'POST') {
    if (!isLanOrLocal) {
      console.warn(`🚨 [Security Alert] Chặn yêu cầu POST ${url.pathname} từ IP ngoài mạng công cộng: ${remoteIp}`);
      return sendJson(res, 403, {
        error: 'Forbidden',
        message: 'Lỗi ủy quyền: Chỉ mạng LAN nội bộ phòng máy và máy chủ Giáo viên mới được phép thao tác!'
      });
    }

    const originHeader = req.headers['origin'] || req.headers['referer'] || '';
    if (!isTrustedOrigin(originHeader)) {
      console.warn(`🚨 [Origin Guard] Bác bỏ yêu cầu từ Origin không tin cậy: ${originHeader}`);
      return sendJson(res, 403, { error: 'Forbidden: Untrusted Origin' });
    }

    if (!verifyCsrf(req.headers)) {
      console.warn(`🚨 [CSRF Guard] Bác bỏ truy cập trái phép vào ${url.pathname} từ IP ${remoteIp}: Thiếu hoặc sai x-cvalms-csrf-token!`);
      return sendJson(res, 403, {
        error: 'Forbidden',
        message: 'Lỗi ủy quyền: Yêu cầu bị từ chối do thiếu hoặc sai mã bảo mật CSRF của Giáo viên!'
      });
    }

    // Nếu thao tác từ máy khác trong LAN (không phải localhost), kiểm tra quyền xác thực Giáo viên
    if (!isLocal) {
      const teacherToken = req.headers['x-cvalms-teacher-token'];
      const hasValidToken = teacherToken && ACTIVE_TEACHER_SESSIONS.has(teacherToken);
      if (!hasValidToken) {
        console.warn(`🚨 [Teacher Auth Guard] Thiết bị LAN (${remoteIp}) thao tác ${url.pathname} nhưng chưa xác thực quyền Giáo viên!`);
        return sendJson(res, 401, {
          error: 'Unauthorized',
          requireLogin: true,
          message: 'Yêu cầu quyền Giáo viên: Vui lòng đăng nhập quyền Giáo viên để điều khiển phòng máy từ xa qua LAN!'
        });
      }
    }
  }

  if (url.pathname === '/api/lock' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine; // 'ALL' hoặc 'MAY-01'
      const message = data.message || 'Thầy đang giảng bài, các em chú ý lên bảng!';
      sendCommandToAgents(target, 'CLASSROOM_FOCUS_LOCK', { message });
      sendJson(res, 200, { success: true, target, action: 'LOCK' });
    });
    return;
  }

  if (url.pathname === '/api/unlock' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine;
      sendCommandToAgents(target, 'CLASSROOM_FOCUS_UNLOCK', {});
      sendJson(res, 200, { success: true, target, action: 'UNLOCK' });
    });
    return;
  }

  if (url.pathname === '/api/wol' && req.method === 'POST') {
    readBody(async (err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine;
      try {
        if (target === 'ALL') {
          for (const seat of Object.values(SEATS)) {
            await sendWakeOnLan(seat.mac);
          }
          sendJson(res, 200, { success: true, message: 'Đã phát gói tin Wake-on-LAN tới 18 máy trạm' });
        } else if (SEATS[target]) {
          await sendWakeOnLan(SEATS[target].mac);
          sendJson(res, 200, { success: true, message: `Đã phát WOL tới ${target}` });
        } else {
          sendJson(res, 404, { error: 'Máy không tồn tại' });
        }
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
    });
    return;
  }

  if (url.pathname === '/api/spotlight' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine; // machineId hoặc null để tắt
      setSpotlightMachine(target);
      sendJson(res, 200, { success: true, activeSpotlight: activeSpotlightMachine });
    });
    return;
  }

  if (url.pathname === '/api/collect' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine || 'ALL';
      const submissionId = `sub_${Date.now()}`;
      sendCommandToAgents(target, 'PREPARE_COLLECT', { submissionId });
      sendJson(res, 200, { success: true, submissionId, message: 'Đã phát lệnh thu bài' });
    });
    return;
  }

  if (url.pathname === '/api/submissions' && req.method === 'GET') {
    sendJson(res, 200, { submissions: STORAGE.getAllSubmissions() });
    return;
  }

  if (url.pathname === '/api/ota-update' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine || 'ALL';
      const downloadUrl = data.downloadUrl;
      const sha256 = data.sha256 || '';

      if (!downloadUrl) {
        return sendJson(res, 400, { error: 'Thiếu downloadUrl cập nhật' });
      }

      sendCommandToAgents(target, 'PERFORM_UPDATE', { downloadUrl, sha256 });
      sendJson(res, 200, { success: true, message: `Đã phát lệnh cập nhật OTA tới ${target}`, downloadUrl });
    });
    return;
  }

  if (url.pathname === '/api/shutdown' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine;
      sendCommandToAgents(target, 'SYSTEM_SHUTDOWN', {});
      sendJson(res, 200, { success: true, message: 'Đã phát lệnh tắt máy' });
    });
    return;
  }

  if (url.pathname === '/api/restart' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = data.targetMachine;
      sendCommandToAgents(target, 'SYSTEM_RESTART', {});
      sendJson(res, 200, { success: true, message: 'Đã phát lệnh khởi động lại' });
    });
    return;
  }

  if (url.pathname === '/api/internet/block' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = (data && data.targetMachine) || 'ALL';
      sendCommandToAgents(target, 'BLOCK_INTERNET', {});
      sendJson(res, 200, { success: true, action: 'BLOCK_INTERNET', message: 'Đã kích hoạt chốt chặn: Khóa toàn bộ Internet WAN' });
    });
    return;
  }

  if (url.pathname === '/api/internet/unblock' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = (data && data.targetMachine) || 'ALL';
      sendCommandToAgents(target, 'UNBLOCK_INTERNET', {});
      sendJson(res, 200, { success: true, action: 'UNBLOCK_INTERNET', message: 'Đã gỡ chốt chặn: Mở lại Internet cho học sinh' });
    });
    return;
  }

  if (url.pathname === '/api/wallpaper/enforce' && req.method === 'POST') {
    readBody((err, data) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });
      const target = (data && data.targetMachine) || 'ALL';
      sendCommandToAgents(target, 'ENFORCE_WALLPAPER', {});
      sendJson(res, 200, { success: true, action: 'ENFORCE_WALLPAPER', message: 'Đã phát lệnh khóa hình nền chuẩn xuống các máy trạm' });
    });
    return;
  }

  if (url.pathname === '/api/broadcast/start' && req.method === 'POST') {
    readBody((err, data) => {
      const title = (data && data.title) || 'Thầy đang trình chiếu bài giảng';
      isTeacherBroadcasting = true;
      sendCommandToAgents('ALL', 'START_TEACHER_BROADCAST', { title });
      broadcastWebLms({ type: 'TEACHER_BROADCAST_STATUS', active: true });
      console.log('📡 [HTTP API] Bắt đầu trình chiếu màn hình giáo viên xuống 18 máy học sinh!');
      sendJson(res, 200, { success: true, active: true, message: 'Đã kích hoạt chế độ chiếu bài giảng giáo viên' });
    });
    return;
  }

  if (url.pathname === '/api/broadcast/stop' && req.method === 'POST') {
    isTeacherBroadcasting = false;
    sendCommandToAgents('ALL', 'STOP_TEACHER_BROADCAST', {});
    broadcastWebLms({ type: 'TEACHER_BROADCAST_STATUS', active: false });
    console.log('🛑 [HTTP API] Đã dừng trình chiếu màn hình giáo viên.');
    sendJson(res, 200, { success: true, active: false, message: 'Đã dừng chiếu bài giảng và mở khóa máy học sinh' });
    return;
  }

  // Phục vụ toàn bộ giao diện Web LMS trực tiếp tại cổng 49150
  const rootDir = path.resolve(__dirname, '..');
  let relPath = decodeURIComponent(url.pathname);
  if (relPath === '/' || relPath === '') {
    relPath = '/index.html';
  }

  const safePath = path.normalize(path.join(rootDir, relPath));
  if (!safePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJson(res, 404, { error: 'Not Found' });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.mp3': 'audio/mpeg'
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  });
});

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// 6. Quản lý lệnh điều khiển tới Agents & Ghi nhật ký Audit Log bất biến
function sendCommandToAgents(target, action, payload = {}) {
  const commandId = `cmd_${crypto.randomUUID()}`;
  const issuedAt = Date.now();
  const cmd = {
    commandId,
    action,
    sessionEpochId: SESSION_EPOCH_ID,
    issuedAt,
    target,
    payload
  };

  // Ghi nhật ký Audit Log bất biến vào gateway/storage/audit_log.jsonl
  logAuditAction({
    commandId,
    action,
    target,
    issuedAt,
    sessionEpochId: SESSION_EPOCH_ID,
    issuedBy: 'Teacher-Gateway-Localhost'
  });

  const jsonBuf = Buffer.from(JSON.stringify(cmd), 'utf8');
  const header = Buffer.alloc(8);
  header.writeUInt32BE(0x4356414C, 0);
  header.writeUInt32BE(jsonBuf.length, 4);
  const packet = Buffer.concat([header, jsonBuf]);

  if (target === 'ALL') {
    for (const seat of Object.values(SEATS)) {
      if (seat.socket && seat.online) {
        seat.socket.write(packet);
      }
    }
  } else if (SEATS[target] && SEATS[target].socket && SEATS[target].online) {
    SEATS[target].socket.write(packet);
  }
}

function setSpotlightMachine(machineId) {
  activeSpotlightMachine = machineId;
  for (const seat of Object.values(SEATS)) {
    seat.isSpotlight = (seat.id === machineId);
    if (seat.socket && seat.online) {
      const msg = Buffer.from(JSON.stringify({
        type: 'SET_STREAM_PROFILE',
        profile: seat.isSpotlight ? 'SPOTLIGHT_HD' : 'OVERVIEW_THUMBNAIL'
      }), 'utf8');
      const header = Buffer.alloc(8);
      header.writeUInt32BE(0x4356414C, 0);
      header.writeUInt32BE(msg.length, 4);
      seat.socket.write(Buffer.concat([header, msg]));
    }
  }
  broadcastWebLms({
    type: 'SPOTLIGHT_CHANGED',
    activeSpotlight: activeSpotlightMachine
  });
}

// 7. WebSocket Handshake thủ công & Xử lý 2 chiều cho Web LMS
webServer.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');
  webSockets.add(socket);

  // Gửi trạng thái ban đầu
  const initMsg = JSON.stringify({
    type: 'INIT_STATE',
    epoch: SESSION_EPOCH_ID,
    activeSpotlight: activeSpotlightMachine,
    isTeacherBroadcasting,
    seats: Object.values(SEATS).map(s => ({
      id: s.id,
      seatIndex: s.seatIndex,
      online: s.online,
      screenState: s.screenState,
      currentApp: s.currentApp,
      isSpotlight: s.isSpotlight
    }))
  });
  sendWsText(socket, initMsg);

  // Buffer phân tích khung WebSocket từ client
  let wsBuffer = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    wsBuffer = Buffer.concat([wsBuffer, chunk]);
    while (wsBuffer.length >= 2) {
      const firstByte = wsBuffer[0];
      const secondByte = wsBuffer[1];
      const opcode = firstByte & 0x0f;
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLen = secondByte & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (wsBuffer.length < offset + 2) break;
        payloadLen = wsBuffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLen === 127) {
        if (wsBuffer.length < offset + 8) break;
        payloadLen = Number(wsBuffer.readBigUInt64BE(offset));
        offset += 8;
      }

      let maskKey = null;
      if (isMasked) {
        if (wsBuffer.length < offset + 4) break;
        maskKey = wsBuffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (wsBuffer.length < offset + payloadLen) break;

      const payload = wsBuffer.slice(offset, offset + payloadLen);
      wsBuffer = wsBuffer.slice(offset + payloadLen);

      if (isMasked && maskKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }

      // Xử lý theo RFC 6455 Opcodes
      if (opcode === 0x8) {
        socket.end();
        break;
      } else if (opcode === 0x9) {
        const pong = Buffer.alloc(2);
        pong[0] = 0x8a;
        pong[1] = 0x00;
        socket.write(pong);
      } else if (opcode === 0x1) {
        try {
          const text = payload.toString('utf8');
          const data = JSON.parse(text);
          handleWebLmsMessage(data);
        } catch (e) {
          console.warn('[Web LMS WS Message Error]:', e.message);
        }
      } else if (opcode === 0x2) {
        // Binary JPEG frame
        broadcastTeacherFrame(payload);
      }
    }
  });

  socket.on('close', () => { webSockets.delete(socket); });
  socket.on('error', () => { webSockets.delete(socket); });
});

function handleWebLmsMessage(data) {
  if (data.type === 'START_TEACHER_BROADCAST') {
    isTeacherBroadcasting = true;
    const title = data.title || 'Thầy đang trình chiếu bài giảng';
    sendCommandToAgents('ALL', 'START_TEACHER_BROADCAST', { title });
    broadcastWebLms({ type: 'TEACHER_BROADCAST_STATUS', active: true });
    console.log('📡 [WebSocket] Bắt đầu trình chiếu màn hình giáo viên xuống 18 máy học sinh!');
  } else if (data.type === 'STOP_TEACHER_BROADCAST') {
    isTeacherBroadcasting = false;
    sendCommandToAgents('ALL', 'STOP_TEACHER_BROADCAST', {});
    broadcastWebLms({ type: 'TEACHER_BROADCAST_STATUS', active: false });
    console.log('🛑 [WebSocket] Đã dừng trình chiếu màn hình giáo viên.');
  } else if (data.type === 'TEACHER_BROADCAST_FRAME') {
    if (data.jpegBase64) {
      const buf = Buffer.from(data.jpegBase64, 'base64');
      broadcastTeacherFrame(buf);
    }
  }
}

function broadcastTeacherFrame(jpegBuffer) {
  if (!jpegBuffer || jpegBuffer.length === 0) return;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(0x43564243, 0); // 'CVBC'
  header.writeUInt32BE(jpegBuffer.length, 4);
  const packet = Buffer.concat([header, jpegBuffer]);

  for (const seat of Object.values(SEATS)) {
    if (seat.socket && seat.online) {
      try {
        seat.socket.write(packet);
      } catch (e) {
        // bỏ qua lỗi tạm thời trên socket từng máy
      }
    }
  }
}

function sendWsText(socket, text) {
  try {
    const payload = Buffer.from(text, 'utf8');
    const length = payload.length;
    let header;

    if (length < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text
      header[1] = length;
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }
    socket.write(Buffer.concat([header, payload]));
  } catch (e) {
    webSockets.delete(socket);
  }
}

function broadcastWebLms(obj) {
  const text = JSON.stringify(obj);
  for (const ws of webSockets) {
    sendWsText(ws, text);
  }
}

function broadcastSeatStatus(seat) {
  broadcastWebLms({
    type: 'SEAT_STATUS',
    seat: {
      id: seat.id,
      seatIndex: seat.seatIndex,
      online: seat.online,
      screenState: seat.screenState,
      currentApp: seat.currentApp,
      isSpotlight: seat.isSpotlight
    }
  });
}

function broadcastFrame(frame) {
  broadcastWebLms({
    type: 'FRAME',
    frame
  });
}

// 8. Khởi động 2 cổng dịch vụ
agentServer.listen(AGENT_MTLS_PORT, '0.0.0.0', () => {
  console.log(`🔒 [mTLS Agent Port] Đang lắng nghe trên 0.0.0.0:${AGENT_MTLS_PORT}`);
});

webServer.listen(WEB_PORT, '0.0.0.0', () => {
  console.log(`🌐 [Web LMS Server] Đang lắng nghe trên http://127.0.0.1:${WEB_PORT} và http://0.0.0.0:${WEB_PORT}`);
});

module.exports = { agentServer, webServer, SEATS, SESSION_EPOCH_ID };
