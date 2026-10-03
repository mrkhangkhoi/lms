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

export function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('[Firebase] Firebase SDK chưa sẵn sàng, đang chạy chế độ Offline Simulation.');
    return null;
  }
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  dbInstance = firebase.database();
  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    return initFirebase();
  }
  return dbInstance;
}

// Lắng nghe tín hiệu phiên học thời gian thực
export function listenActiveSession(onUpdate) {
  const db = getDb();
  if (!db) return () => {};

  const ref = db.ref('activeSession');
  const callback = snap => {
    const data = snap.val();
    onUpdate(data);
  };

  ref.on('value', callback);
  return () => ref.off('value', callback);
}

// Báo danh máy học sinh lên Firebase
export function registerMachineCheckin(classId, machineId, students) {
  const db = getDb();
  if (!db) return Promise.resolve();

  return db.ref(`activeSession/machines/${machineId}`).set({
    machineId,
    students,
    status: 'active',
    joinedAt: Date.now(),
    isSos: false
  });
}

// Gửi câu trả lời Quick Poll (Chặng 1)
export function submitPollChoice(machineId, choice) {
  const db = getDb();
  if (!db) return Promise.resolve();

  return db.ref(`activeSession/pollAnswers/${machineId}`).set({
    choice,
    timestamp: Date.now()
  });
}

// Nộp bài thảo luận nhóm đôi (Chặng 3)
export function submitDiscussionAnswer(machineId, content, students) {
  const db = getDb();
  if (!db) return Promise.resolve();

  return db.ref(`activeSession/discussionAnswers/${machineId}`).set({
    machineId,
    students,
    content,
    status: 'submitted',
    submittedAt: Date.now()
  });
}

// Bật / tắt tín hiệu xin trợ giúp (✋ SOS)
export function setSosSignal(machineId, isSos) {
  const db = getDb();
  if (!db) return Promise.resolve();

  return db.ref(`activeSession/machines/${machineId}/isSos`).set(isSos);
}
