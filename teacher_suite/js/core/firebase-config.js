/* ==========================================================
 * FIREBASE-CONFIG.JS — Kết nối & Đồng bộ Realtime an toàn
 * ========================================================== */

// Cấu hình Firebase Realtime Database (Tái sử dụng cấu hình dự án của bạn)
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCC2tCURXYAMpdN687kcjY537K7zUhh_Fg",
  authDomain: "day-hoc-tuong-tac-7ee69.firebaseapp.com",
  databaseURL: "https://day-hoc-tuong-tac-7ee69-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "day-hoc-tuong-tac-7ee69",
  storageBucket: "day-hoc-tuong-tac-7ee69.firebasestorage.app",
  messagingSenderId: "628267818434",
  appId: "1:628267818434:web:a0b8d1ceda61affea20a5b"
};

let dbInstance = null;
let lanSocket = null;
const sessionListeners = new Set();
let cachedSession = {
  classId: '10A1',
  lessonId: '',
  lessonData: null,
  currentPhase: 'waiting',
  sessionStatus: 'active',
  machines: {},
  pollAnswers: {},
  discussionAnswers: {}
};

// Khởi tạo LAN WebSocket kết nối tới Gateway máy giáo viên (Cổng 49150)
function initLanSocket() {
  if (lanSocket && (lanSocket.readyState === WebSocket.OPEN || lanSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '127.0.0.1';
  const wsUrl = `ws://${host}:49150`;

  try {
    lanSocket = new WebSocket(wsUrl);

    lanSocket.onopen = () => {
      console.log('⚡ [LAN Realtime] Đã kết nối thành công Gateway LAN (Port 49150)!');
      lanSocket.send(JSON.stringify({ type: 'LMS_GET_SESSION' }));
    };

    lanSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'LMS_SESSION_UPDATE' && msg.session) {
          cachedSession = msg.session;
          for (const callback of sessionListeners) {
            try { callback(cachedSession); } catch (e) { console.error(e); }
          }
        }
      } catch (err) {
        // bỏ qua frame nhị phân hoặc tin nhắn khác
      }
    };

    lanSocket.onclose = () => {
      setTimeout(initLanSocket, 3000);
    };

    lanSocket.onerror = () => {
      // Gateway chưa chạy hoặc ở xa, sẽ tự kết nối lại
    };
  } catch (e) {
    // Trình duyệt không hỗ trợ WS hoặc môi trường test
  }
}

// Khởi chạy LAN Socket ngay khi nạp module
if (typeof window !== 'undefined' && typeof WebSocket !== 'undefined') {
  initLanSocket();
}

function sendLanMessage(payload) {
  if (lanSocket && lanSocket.readyState === WebSocket.OPEN) {
    try {
      lanSocket.send(JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export function initFirebase() {
  if (typeof firebase === 'undefined') {
    return null;
  }
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    dbInstance = firebase.database();
    return dbInstance;
  } catch (e) {
    console.warn('[Firebase] Khởi tạo Firebase thất bại, tiếp tục với LAN WebSocket:', e.message);
    return null;
  }
}

export function getDb() {
  if (!dbInstance) {
    return initFirebase();
  }
  return dbInstance;
}

// Lắng nghe tín hiệu phiên học thời gian thực (Ưu tiên LAN Gateway)
export function listenActiveSession(onUpdate) {
  sessionListeners.add(onUpdate);

  if (cachedSession) {
    try { onUpdate(cachedSession); } catch (e) { /* ignore */ }
  }

  sendLanMessage({ type: 'LMS_GET_SESSION' });

  let fbCleanup = null;
  try {
    const db = getDb();
    if (db) {
      const ref = db.ref('activeSession');
      const callback = snap => {
        const data = snap.val();
        if (data) {
          cachedSession = data;
          onUpdate(data);
        }
      };
      ref.on('value', callback);
      fbCleanup = () => ref.off('value', callback);
    }
  } catch (e) {
    // Không có mạng ngoài, bỏ qua Firebase
  }

  return () => {
    sessionListeners.delete(onUpdate);
    if (fbCleanup) fbCleanup();
  };
}

// Báo danh máy học sinh (LAN Gateway trước, Firebase sau)
export function registerMachineCheckin(classId, machineId, students) {
  sendLanMessage({
    type: 'LMS_CHECKIN',
    classId,
    machineId,
    students
  });

  try {
    const db = getDb();
    if (db) {
      return db.ref(`activeSession/machines/${machineId}`).set({
        machineId,
        students,
        status: 'active',
        joinedAt: Date.now(),
        isSos: false
      }).catch(() => {});
    }
  } catch (e) { /* ignore offline */ }

  return Promise.resolve();
}

// Gửi câu trả lời Quick Poll (LAN Gateway trước, Firebase sau)
export function submitPollChoice(machineId, choice) {
  sendLanMessage({
    type: 'LMS_POLL_SUBMIT',
    machineId,
    choice
  });

  try {
    const db = getDb();
    if (db) {
      return db.ref(`activeSession/pollAnswers/${machineId}`).set({
        choice,
        timestamp: Date.now()
      }).catch(() => {});
    }
  } catch (e) { /* ignore offline */ }

  return Promise.resolve();
}

// Nộp bài thảo luận nhóm đôi (LAN Gateway trước, Firebase sau)
export function submitDiscussionAnswer(machineId, content, students) {
  sendLanMessage({
    type: 'LMS_DISCUSSION_SUBMIT',
    machineId,
    content,
    students
  });

  try {
    const db = getDb();
    if (db) {
      return db.ref(`activeSession/discussionAnswers/${machineId}`).set({
        machineId,
        students,
        content,
        status: 'submitted',
        submittedAt: Date.now()
      }).catch(() => {});
    }
  } catch (e) { /* ignore offline */ }

  return Promise.resolve();
}

// Bật / tắt tín hiệu xin trợ giúp (✋ SOS)
export function setSosSignal(machineId, isSos) {
  sendLanMessage({
    type: 'LMS_SOS',
    machineId,
    isSos
  });

  try {
    const db = getDb();
    if (db) {
      return db.ref(`activeSession/machines/${machineId}/isSos`).set(isSos).catch(() => {});
    }
  } catch (e) { /* ignore offline */ }

  return Promise.resolve();
}
