/**
 * ============================================================================
 * LIVE MONITOR - HỆ THỐNG GIÁM SÁT 18 MÁY PHÒNG MÁY THỜI GIAN THỰC (HYBRID AGENT)
 * Chuẩn công nghiệp: WebSocket Loopback, Binary Frame Stream, Zero-Lag Ring Buffer,
 * Tương thích Deep Freeze, Soft Classroom Focus Lock, Wake-on-LAN & Durable Storage.
 * ============================================================================
 */

(function () {
  'use strict';

  const GATEWAY_WS_URL = 'ws://127.0.0.1:49150';
  const GATEWAY_HTTP_URL = 'http://127.0.0.1:49150';

  const STATE = {
    socket: null,
    isConnected: false,
    reconnectTimer: null,
    csrfToken: '',
    sessionEpochId: '',
    activeSpotlight: null,
    isBroadcasting: false,
    broadcastStream: null,
    broadcastTimer: null,
    broadcastVideo: null,
    broadcastCanvas: null,
    seats: {}, // 'MAY-01' -> { id, seatIndex, online, screenState, currentApp, isSpotlight, fps, frameCount, lastTs }
    imagesCache: {} // Reusable Image objects to avoid GC pressure
  };

  // Khởi tạo danh sách máy phòng học (Mặc định 18 máy, linh hoạt mở rộng 24, 30, 36, 48 máy)
  const savedSeats = parseInt(localStorage.getItem('cvalms_seat_count') || '18', 10);
  STATE.totalSeats = Number.isFinite(savedSeats) && savedSeats >= 1 ? savedSeats : 18;

  function ensureSeatObject(idOrIndex) {
    let mId, seatIndex;
    if (typeof idOrIndex === 'number') {
      seatIndex = idOrIndex;
      mId = `MAY-${String(idOrIndex).padStart(2, '0')}`;
    } else {
      mId = String(idOrIndex);
      seatIndex = parseInt(mId.replace(/\D/g, ''), 10) || 1;
    }
    if (!STATE.seats[mId]) {
      STATE.seats[mId] = {
        id: mId,
        seatIndex: seatIndex,
        online: false,
        screenState: 'OFFLINE',
        netBlocked: false,
        currentApp: '---',
        isSpotlight: false,
        fps: 0,
        frameCount: 0,
        lastTs: Date.now()
      };
    }
    return STATE.seats[mId];
  }

  for (let i = 1; i <= STATE.totalSeats; i++) {
    ensureSeatObject(i);
  }

  // ==========================================================================
  // 1. KẾT NỐI WEBSOCKET TỚI LOCAL LAB GATEWAY
  // ==========================================================================
  function initWebSocket() {
    if (STATE.socket && (STATE.socket.readyState === WebSocket.OPEN || STATE.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    updateGatewayStatus(false, 'Đang kết nối tới Gateway Local...');

    try {
      STATE.socket = new WebSocket(GATEWAY_WS_URL);
    } catch (err) {
      console.warn('[LiveMonitor] Lỗi tạo WebSocket:', err.message);
      scheduleReconnect();
      return;
    }

    STATE.socket.onopen = function () {
      STATE.isConnected = true;
      updateGatewayStatus(true, 'Đã kết nối Gateway Local (Port 49150)');
      fetchGatewayStatus(); // Lấy CSRF token và trạng thái khởi tạo
    };

    STATE.socket.onmessage = function (event) {
      try {
        const msg = JSON.parse(event.data);
        handleGatewayMessage(msg);
      } catch (err) {
        console.warn('[LiveMonitor] Lỗi parse frame/message:', err.message);
      }
    };

    STATE.socket.onclose = function () {
      STATE.isConnected = false;
      updateGatewayStatus(false, 'Mất kết nối Gateway. Đang thử lại sau 3s...');
      setAllSeatsOffline();
      scheduleReconnect();
    };

    STATE.socket.onerror = function (err) {
      console.warn('[LiveMonitor] WebSocket error:', err);
      STATE.socket.close();
    };
  }


  function scheduleReconnect() {
    if (STATE.reconnectTimer) clearTimeout(STATE.reconnectTimer);
    STATE.reconnectTimer = setTimeout(() => {
      initWebSocket();
    }, 3000);
  }

  // ==========================================================================
  // 2. XỬ LÝ GÓI TIN TỪ GATEWAY
  // ==========================================================================
  function handleGatewayMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'INIT_STATE':
        STATE.sessionEpochId = msg.epoch;
        if (msg.csrfToken) {
          STATE.csrfToken = msg.csrfToken;
        }
        STATE.activeSpotlight = msg.activeSpotlight;
        if (typeof msg.isTeacherBroadcasting === 'boolean') {
          updateBroadcastButtonsUI(msg.isTeacherBroadcasting);
        }
        if (Array.isArray(msg.seats)) {
          msg.seats.forEach(s => {
            if (STATE.seats[s.id]) {
              Object.assign(STATE.seats[s.id], s);
              updateSeatCardUI(s.id);
            }
          });
        }
        updateOverallStats();
        break;

      case 'SEAT_STATUS':
        if (msg.seat && STATE.seats[msg.seat.id]) {
          Object.assign(STATE.seats[msg.seat.id], msg.seat);
          updateSeatCardUI(msg.seat.id);
          updateOverallStats();
        }
        break;

      case 'FRAME':
        if (msg.frame) {
          renderFrameToCanvas(msg.frame);
        }
        break;

      case 'SPOTLIGHT_CHANGED':
        STATE.activeSpotlight = msg.activeSpotlight;
        updateSpotlightUI();
        break;

      case 'TEACHER_BROADCAST_STATUS':
        if (typeof msg.active === 'boolean') {
          if (!msg.active && STATE.isBroadcasting) {
            stopTeacherBroadcast(false);
          } else {
            updateBroadcastButtonsUI(msg.active);
          }
        }
        break;

      case 'SUBMISSION_COMMITTED':
        handleSubmissionCommitted(msg.submission);
        break;

      default:
        break;
    }
  }

  // Lấy trạng thái REST HTTP để có CSRF Token
  async function fetchGatewayStatus() {
    try {
      // 1. Lấy mã CSRF Token bảo mật trực tiếp từ endpoint Localhost của Giáo viên
      const csrfRes = await fetch(`${GATEWAY_HTTP_URL}/api/csrf`);
      if (csrfRes.ok) {
        const csrfData = await csrfRes.json();
        STATE.csrfToken = csrfData.csrfToken || '';
        STATE.sessionEpochId = csrfData.epoch || '';
      }

      // 2. Lấy trạng thái danh sách máy
      const res = await fetch(`${GATEWAY_HTTP_URL}/api/status`);
      if (res.ok) {
        const data = await res.json();
        STATE.activeSpotlight = data.activeSpotlight || null;
      }
    } catch (err) {
      console.warn('[LiveMonitor] Không kết nối được Gateway API:', err.message);
    }
  }

  // ==========================================================================
  // 3. RENDER KHUNG HÌNH (CANVAS 2D - BOUNDED QUEUE 1 - ZERO ACCUMULATED LAG)
  // ==========================================================================
  function renderFrameToCanvas(frame) {
    const mId = frame.machineId;
    const seat = STATE.seats[mId];
    if (!seat) return;

    seat.online = true;
    seat.screenState = (frame.state === 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED')
      ? 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED'
      : 'ONLINE';

    // Tính FPS đo đạc thực tế
    seat.frameCount++;
    const now = Date.now();
    if (now - seat.lastTs >= 1000) {
      seat.fps = seat.frameCount;
      seat.frameCount = 0;
      seat.lastTs = now;
      updateFpsBadge(mId, seat.fps);
    }

    // Vẽ lên Thumbnail Canvas của máy
    const canvas = document.getElementById(`mon-canvas-${mId}`);
    if (canvas && frame.jpegBase64) {
      drawJpegToCanvas(canvas, frame.jpegBase64, seat.screenState === 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED');
    }

    // Nếu máy này đang được Spotlight -> vẽ lên Modal Canvas Full HD
    if (STATE.activeSpotlight === mId) {
      const spotCanvas = document.getElementById('modal-spotlight-canvas');
      if (spotCanvas && frame.jpegBase64) {
        drawJpegToCanvas(spotCanvas, frame.jpegBase64, seat.screenState === 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED');
      }
    }

    updateSeatCardUI(mId);
  }

  function drawJpegToCanvas(canvas, base64Data, isUacBlocked) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let img = STATE.imagesCache[canvas.id];
    if (!img) {
      img = new Image();
      STATE.imagesCache[canvas.id] = img;
    }

    img.onload = function () {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Nếu có màn hình UAC / Secure Desktop bảo mật
      if (isUacBlocked) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ MÀN HÌNH BẢO MẬT WINDOWS (UAC)', canvas.width / 2, canvas.height / 2 - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText('Học sinh đang mở hộp thoại Administrator', canvas.width / 2, canvas.height / 2 + 15);
      }
    };

    img.src = `data:image/jpeg;base64,${base64Data}`;
  }

  function drawOfflinePlaceholder(canvas, machineId) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lưới Cyberpunk tinh tế
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${machineId} • OFFLINE`, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.fillText('Chưa kết nối Agent hoặc máy đang tắt', canvas.width / 2, canvas.height / 2 + 20);
  }

  // ==========================================================================
  // 4. ĐỒNG BỘ GIAO DIỆN VÀ TÊN HỌC SINH TỪ STORE
  // ==========================================================================
  function getStudentNamesForMachine(seatIndex) {
    try {
      if (window.STORE && typeof window.STORE.getState === 'function') {
        const state = window.STORE.getState();
        const currentClassId = state.classId || '6A1';
        if (window.EMBEDDED_CLASSES && window.EMBEDDED_CLASSES[currentClassId]) {
          const seatingPlan = window.EMBEDDED_CLASSES[currentClassId].seatingPlan;
          if (seatingPlan && seatingPlan[seatIndex]) {
            const list = seatingPlan[seatIndex];
            return Array.isArray(list) ? list.join(' • ') : String(list);
          }
        }
      }
    } catch (err) {
      console.warn('[LiveMonitor] Lỗi đọc tên học sinh từ Store:', err.message);
    }
    return 'Chưa xếp chỗ';
  }

  function updateSeatCardUI(mId) {
    const seat = STATE.seats[mId];
    if (!seat) return;

    let card = document.getElementById(`mon-card-${mId}`);
    if (!card) {
      renderMonitorGrid();
      card = document.getElementById(`mon-card-${mId}`);
      if (!card) return;
    }

    // Cập nhật tên học sinh
    const studentEl = card.querySelector('.mon-card-students');
    if (studentEl) {
      studentEl.textContent = getStudentNamesForMachine(seat.seatIndex);
      studentEl.title = studentEl.textContent;
    }

    // Cập nhật Badge trạng thái
    const badgeEl = card.querySelector('.mon-card-badge');
    if (badgeEl) {
      badgeEl.className = 'mon-card-badge';
      if (!seat.online) {
        badgeEl.classList.add('badge-offline');
        badgeEl.textContent = 'OFFLINE';
      } else if (seat.screenState === 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED') {
        badgeEl.classList.add('badge-uac');
        badgeEl.textContent = 'UAC SHIELD';
      } else if (seat.screenState === 'LOCKED') {
        badgeEl.classList.add('badge-locked');
        badgeEl.textContent = 'ĐANG KHÓA';
      } else {
        badgeEl.classList.add('badge-online');
        badgeEl.textContent = 'ONLINE';
      }
    }

    // Cập nhật ứng dụng hiện tại
    const appEl = card.querySelector('.mon-card-app-name');
    if (appEl) {
      appEl.textContent = seat.online ? (seat.currentApp || 'Desktop') : '---';
    }

    // Hiệu ứng viền Spotlight nếu đang được chiếu
    if (STATE.activeSpotlight === mId) {
      card.classList.add('spotlight-active');
    } else {
      card.classList.remove('spotlight-active');
    }

    // Cập nhật trạng thái nút Nét và nút Wake-on-LAN
    const btnNetEl = card.querySelector('.btn-net');
    if (btnNetEl) {
      btnNetEl.replaceChildren();
      const netIcon = document.createElement('i');
      if (seat.netBlocked) {
        netIcon.className = 'fas fa-ban';
        btnNetEl.appendChild(netIcon);
        btnNetEl.style.color = '#ef4444';
        btnNetEl.title = `Đang khóa Internet ${mId} - Bấm để mở lại`;
      } else {
        netIcon.className = 'fas fa-globe';
        btnNetEl.appendChild(netIcon);
        btnNetEl.style.color = '';
        btnNetEl.title = `Đang mở Internet - Bấm để khóa mạng ${mId}`;
      }
    }

    const btnWolEl = card.querySelector('.btn-wol-single');
    if (btnWolEl) {
      btnWolEl.style.display = seat.online ? 'none' : 'inline-flex';
      btnWolEl.style.color = '#10b981';
    }

    // Nếu offline, vẽ màn hình placeholder
    if (!seat.online) {
      const canvas = document.getElementById(`mon-canvas-${mId}`);
      if (canvas) drawOfflinePlaceholder(canvas, mId);
    }
  }

  function updateFpsBadge(mId, fps) {
    const card = document.getElementById(`mon-card-${mId}`);
    if (!card) return;
    const fpsEl = card.querySelector('.mon-card-fps');
    if (fpsEl) {
      fpsEl.textContent = `${fps} FPS`;
    }
  }

  function setAllSeatsOffline() {
    Object.keys(STATE.seats).forEach(mId => {
      STATE.seats[mId].online = false;
      STATE.seats[mId].screenState = 'OFFLINE';
      STATE.seats[mId].fps = 0;
      updateSeatCardUI(mId);
    });
    updateOverallStats();
  }

  function updateOverallStats() {
    let onlineCount = 0;
    let lockedCount = 0;
    let uacCount = 0;

    Object.values(STATE.seats).forEach(seat => {
      if (seat.online) {
        onlineCount++;
        if (seat.screenState === 'LOCKED') lockedCount++;
        if (seat.screenState === 'SCREEN_STATE_SECURE_DESKTOP_BLOCKED') uacCount++;
      }
    });

    const statTotal = document.getElementById('mon-stat-total');
    if (statTotal) statTotal.textContent = String(Object.keys(STATE.seats).length);

    const statOnline = document.getElementById('mon-stat-online');
    if (statOnline) statOnline.textContent = String(onlineCount);

    const statLocked = document.getElementById('mon-stat-locked');
    if (statLocked) statLocked.textContent = String(lockedCount);

    const statUac = document.getElementById('mon-stat-uac');
    if (statUac) statUac.textContent = String(uacCount);
  }

  function updateGatewayStatus(isOnline, text) {
    const dot = document.getElementById('mon-gateway-dot');
    const label = document.getElementById('mon-gateway-label');
    if (dot) {
      dot.className = isOnline ? 'gateway-dot online' : 'gateway-dot offline';
    }
    if (label) {
      label.textContent = text;
    }
  }

  function updateSpotlightUI() {
    Object.keys(STATE.seats).forEach(mId => {
      const card = document.getElementById(`mon-card-${mId}`);
      if (card) {
        if (STATE.activeSpotlight === mId) {
          card.classList.add('spotlight-active');
        } else {
          card.classList.remove('spotlight-active');
        }
      }
    });

    const modal = document.getElementById('modal-monitor-spotlight');
    if (!STATE.activeSpotlight) {
      if (modal) modal.style.display = 'none';
    } else {
      if (modal) {
        modal.style.display = 'flex';
        const titleEl = document.getElementById('spotlight-modal-title');
        const subEl = document.getElementById('spotlight-modal-sub');
        if (titleEl) titleEl.textContent = `CHIẾU MÀN HÌNH SPOTLIGHT: ${STATE.activeSpotlight}`;
        if (subEl) {
          const seat = STATE.seats[STATE.activeSpotlight];
          subEl.textContent = seat ? `Học sinh: ${getStudentNamesForMachine(seat.seatIndex)} • Ứng dụng: ${seat.currentApp || 'Desktop'}` : '';
        }
      }
    }
  }

  // ==========================================================================
  // 5. CÁC TÁC VỤ ĐIỀU KHIỂN (CALL REST API TỚI GATEWAY)
  // ==========================================================================
  async function callGatewayApi(endpoint, body) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (STATE.csrfToken) {
        headers['x-cvalms-csrf-token'] = STATE.csrfToken;
      }
      const res = await fetch(`${GATEWAY_HTTP_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (err) {
      console.warn(`[LiveMonitor] Lỗi gọi ${endpoint}:`, err.message);
      showNotificationToast('Lỗi kết nối Gateway', 'Không thể gửi lệnh tới Gateway Local.', 'error');
      return { error: err.message };
    }
  }

  async function wakeOnLan(target) {
    showNotificationToast('Wake-on-LAN', `Đang phát gói tin khởi động máy tới ${target}...`, 'info');
    const res = await callGatewayApi('/api/wol', { targetMachine: target });
    if (res && res.success) {
      showNotificationToast('Thành công', res.message || 'Đã phát tín hiệu WOL', 'success');
    }
  }

  async function lockMachine(target) {
    const msg = 'Thầy đang giảng bài, các em chú ý lên bảng!';
    showNotificationToast('Khóa màn hình', `Đang khóa tập trung ${target}...`, 'info');
    const res = await callGatewayApi('/api/lock', { targetMachine: target, message: msg });
    if (res && res.success) {
      showNotificationToast('Đã khóa màn hình', `Đã kích hoạt Soft Classroom Lock cho ${target}`, 'success');
    }
  }

  async function unlockMachine(target) {
    showNotificationToast('Mở khóa', `Đang mở khóa cho ${target}...`, 'info');
    const res = await callGatewayApi('/api/unlock', { targetMachine: target });
    if (res && res.success) {
      showNotificationToast('Đã mở khóa', `Đã trả lại quyền điều khiển cho ${target}`, 'success');
    }
  }

  async function toggleSpotlight(machineId) {
    const nextTarget = (STATE.activeSpotlight === machineId) ? null : machineId;
    STATE.activeSpotlight = nextTarget;
    updateSpotlightUI();

    const res = await callGatewayApi('/api/spotlight', { targetMachine: nextTarget });
    if (res && res.success) {
      STATE.activeSpotlight = res.activeSpotlight;
      updateSpotlightUI();
    }
  }

  async function collectFiles(target) {
    showNotificationToast('Thu bài tập', `Đang phát lệnh thu gom bài tập từ ${target}...`, 'info');
    const res = await callGatewayApi('/api/collect', { targetMachine: target });
    if (res && res.success) {
      showNotificationToast('Lệnh thu bài đã phát', `Mã giao dịch: ${res.submissionId}. Chờ các máy đóng gói...`, 'success');
    }
  }

  async function shutdownMachine(target) {
    const confirmMsg = (target === 'ALL')
      ? 'CẢNH BÁO: Thầy có chắc chắn muốn TẮT TOÀN BỘ 18 MÁY TRẠM phòng máy ngay lập tức?'
      : `Thầy có chắc chắn muốn TẮT MÁY ${target}?`;

    if (!window.confirm(confirmMsg)) return;

    showNotificationToast('Tắt máy', `Đang gửi tín hiệu Shutdown tới ${target}...`, 'info');
    const res = await callGatewayApi('/api/shutdown', { targetMachine: target });
    if (res && res.success) {
      showNotificationToast('Đã phát lệnh tắt máy', res.message || 'Hệ điều hành các máy đang tắt an toàn', 'success');
    }
  }

  async function restartMachine(target) {
    const confirmMsg = (target === 'ALL')
      ? 'CẢNH BÁO: Thầy có chắc chắn muốn KHỞI ĐỘNG LẠI (RESET) TOÀN BỘ 18 MÁY TRẠM phòng máy ngay lập tức?'
      : `Thầy có chắc chắn muốn KHỞI ĐỘNG LẠI ${target}?`;

    if (!window.confirm(confirmMsg)) return;

    showNotificationToast('Khởi động lại', `Đang gửi tín hiệu Restart tới ${target}...`, 'info');
    const res = await callGatewayApi('/api/restart', { targetMachine: target });
    if (res && res.success) {
      showNotificationToast('Đã phát lệnh khởi động lại', res.message || 'Hệ điều hành các máy đang khởi động lại...', 'success');
    }
  }

  async function setInternetLock(block, target = 'ALL') {
    const endpoint = block ? '/api/internet/block' : '/api/internet/unblock';
    const actionName = block ? 'Khóa Internet WAN' : 'Mở mạng Internet';

    showNotificationToast(actionName, `Đang gửi lệnh tới ${target}...`, 'info');
    const res = await callGatewayApi(endpoint, { targetMachine: target });
    if (res && res.success) {
      showNotificationToast('Thành công', res.message || `${actionName} hoàn tất!`, 'success');
      const btnBlock = document.getElementById('btn-mon-block-net');
      const btnUnblock = document.getElementById('btn-mon-unblock-net');
      if (btnBlock && btnUnblock) {
        btnBlock.style.display = block ? 'none' : 'inline-flex';
        btnUnblock.style.display = block ? 'inline-flex' : 'none';
      }
    }
  }

  // ==========================================================================
  // 5.1. TRÌNH CHIẾU MÀN HÌNH GIÁO VIÊN (POWERPOINT/DESKTOP) & KHÓA PHÍM/CHUỘT
  // ==========================================================================
  async function startTeacherBroadcast() {
    if (STATE.isBroadcasting) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      showNotificationToast('Không hỗ trợ', 'Trình duyệt không hỗ trợ chức năng chia sẻ màn hình getDisplayMedia!', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: { ideal: 15, max: 20 },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      });

      STATE.broadcastStream = stream;
      STATE.isBroadcasting = true;

      // Video element ẩn để đọc frames
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      STATE.broadcastVideo = video;

      // Offscreen canvas để nén JPEG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      STATE.broadcastCanvas = canvas;

      // Lắng nghe khi giáo viên bấm "Dừng chia sẻ" từ thanh công cụ của trình duyệt
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopTeacherBroadcast(true);
        };
      }

      // Phát lệnh khóa chuột/phím học sinh và bật cửa sổ chiếu Fullscreen TopMost
      await callGatewayApi('/api/broadcast/start', { title: 'Thầy đang trình chiếu bài giảng' });
      if (STATE.socket && STATE.socket.readyState === WebSocket.OPEN) {
        STATE.socket.send(JSON.stringify({ type: 'START_TEACHER_BROADCAST', title: 'Thầy đang trình chiếu bài giảng' }));
      }

      updateBroadcastButtonsUI(true);
      showNotificationToast(
        '📡 Đang trình chiếu bài giảng',
        'Màn hình Thầy đang chiếu tới 18 máy. Toàn bộ chuột và bàn phím học sinh đã bị khóa cứng!',
        'success'
      );

      // Kích thước chuẩn HD để truyền mượt mà không trễ
      const targetWidth = 1280;
      const targetHeight = 720;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      let isFrameBusy = false;
      STATE.broadcastTimer = setInterval(() => {
        if (!STATE.isBroadcasting || isFrameBusy) return;
        if (!video.videoWidth || !video.videoHeight) return;

        isFrameBusy = true;
        try {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          canvas.toBlob((blob) => {
            if (blob && STATE.isBroadcasting) {
              blob.arrayBuffer().then((buf) => {
                if (STATE.socket && STATE.socket.readyState === WebSocket.OPEN) {
                  STATE.socket.send(buf);
                }
                isFrameBusy = false;
              }).catch(() => { isFrameBusy = false; });
            } else {
              isFrameBusy = false;
            }
          }, 'image/jpeg', 0.72);
        } catch (fErr) {
          isFrameBusy = false;
          console.warn('[LiveMonitor] Lỗi chụp khung hình trình chiếu:', fErr?.message || fErr);
        }
      }, 66); // ~15 FPS

    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.warn('[LiveMonitor] Lỗi kích hoạt trình chiếu:', err);
        showNotificationToast('Lỗi trình chiếu', err.message, 'error');
      }
      stopTeacherBroadcast(false);
    }
  }

  async function stopTeacherBroadcast(notifyGateway = true) {
    if (STATE.broadcastTimer) {
      clearInterval(STATE.broadcastTimer);
      STATE.broadcastTimer = null;
    }

    if (STATE.broadcastStream) {
      STATE.broadcastStream.getTracks().forEach(track => {
        try { track.stop(); } catch (tErr) { console.warn('[LiveMonitor Track Stop Warning]:', tErr?.message || tErr); }
      });
      STATE.broadcastStream = null;
    }

    if (STATE.broadcastVideo) {
      STATE.broadcastVideo.srcObject = null;
      STATE.broadcastVideo = null;
    }
    STATE.broadcastCanvas = null;

    const wasBroadcasting = STATE.isBroadcasting;
    STATE.isBroadcasting = false;

    updateBroadcastButtonsUI(false);

    if (notifyGateway && wasBroadcasting) {
      await callGatewayApi('/api/broadcast/stop', {});
      if (STATE.socket && STATE.socket.readyState === WebSocket.OPEN) {
        STATE.socket.send(JSON.stringify({ type: 'STOP_TEACHER_BROADCAST' }));
      }
      showNotificationToast(
        '🛑 Đã dừng trình chiếu',
        'Đã mở khóa chuột và bàn phím cho 18 máy học sinh ngay lập tức!',
        'info'
      );
    }
  }

  function updateBroadcastButtonsUI(isBroadcasting) {
    const btnStart = document.getElementById('btn-mon-broadcast-start');
    const btnStop = document.getElementById('btn-mon-broadcast-stop');
    if (btnStart && btnStop) {
      if (isBroadcasting) {
        btnStart.style.display = 'none';
        btnStop.style.display = 'inline-flex';
      } else {
        btnStart.style.display = 'inline-flex';
        btnStop.style.display = 'none';
      }
    }
  }

  function handleSubmissionCommitted(sub) {
    if (!sub) return;
    showNotificationToast(
      '📥 Thu bài thành công!',
      `Máy ${sub.machineId} (${sub.studentName}) đã nộp bài.\nHash SHA-256: ${sub.expectedHash ? sub.expectedHash.substring(0, 12) : ''}...`,
      'success'
    );
  }

  // Toast thông báo sư phạm
  function showNotificationToast(title, desc, type) {
    const toast = document.getElementById('activity-finishing-toast');
    if (!toast) return;

    const titleEl = document.getElementById('aft-title');
    const descEl = document.getElementById('aft-desc');
    const spinner = toast.querySelector('.aft-spinner');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (spinner) {
      if (type === 'error') {
        spinner.innerHTML = /* sanitize */ '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i>';
      } else if (type === 'info') {
        spinner.innerHTML = /* sanitize */ '<i class="fas fa-info-circle" style="color:#3b82f6;"></i>';
      } else {
        spinner.innerHTML = /* sanitize */ '<i class="fas fa-check-circle" style="color:#10b981;"></i>';
      }
    }

    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  // ==========================================================================
  // 6. KHỞI TẠO DOM VÀ SỰ KIỆN GIAO DIỆN
  // ==========================================================================
  function renderMonitorGrid() {
    const gridContainer = document.getElementById('monitor-grid-container');
    if (!gridContainer) return;

    // Xóa nội dung cũ một cách an toàn
    gridContainer.textContent = '';

    const total = Math.max(STATE.totalSeats, Object.keys(STATE.seats).length);
    for (let i = 1; i <= total; i++) {
      ensureSeatObject(i);
      const mId = `MAY-${String(i).padStart(2, '0')}`;
      const card = document.createElement('div');
      card.className = 'mon-card';
      card.id = `mon-card-${mId}`;

      // Card Header
      const header = document.createElement('div');
      header.className = 'mon-card-header';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'mon-card-title-wrap';

      const title = document.createElement('div');
      title.className = 'mon-card-title';
      title.textContent = mId;

      const students = document.createElement('div');
      students.className = 'mon-card-students';
      students.textContent = getStudentNamesForMachine(i);
      students.title = students.textContent;

      titleWrap.appendChild(title);
      titleWrap.appendChild(students);

      const badge = document.createElement('div');
      badge.className = 'mon-card-badge badge-offline';
      badge.textContent = 'OFFLINE';

      header.appendChild(titleWrap);
      header.appendChild(badge);

      // Card Body (Canvas)
      const body = document.createElement('div');
      body.className = 'mon-card-body';

      const canvas = document.createElement('canvas');
      canvas.id = `mon-canvas-${mId}`;
      canvas.className = 'mon-screen-canvas';
      canvas.width = 480;
      canvas.height = 270;
      canvas.onclick = () => toggleSpotlight(mId);
      body.appendChild(canvas);

      // Card Footer
      const footer = document.createElement('div');
      footer.className = 'mon-card-footer';

      const meta = document.createElement('div');
      meta.className = 'mon-card-meta';

      const appName = document.createElement('span');
      appName.className = 'mon-card-app-name';
      appName.textContent = '---';

      const fps = document.createElement('span');
      fps.className = 'mon-card-fps';
      fps.textContent = '0 FPS';

      meta.appendChild(appName);
      meta.appendChild(fps);

      const actions = document.createElement('div');
      actions.className = 'mon-card-actions';

      // Nút Spotlight
      const btnSpotlight = document.createElement('button');
      btnSpotlight.type = 'button';
      btnSpotlight.className = 'mon-btn-mini btn-spotlight';
      btnSpotlight.title = 'Chiếu Spotlight Full HD lên bảng';
      btnSpotlight.innerHTML = /* sanitize */ '<i class="fas fa-expand"></i>';
      btnSpotlight.onclick = (e) => { e.stopPropagation(); toggleSpotlight(mId); };

      // Nút Lock/Unlock
      const btnLock = document.createElement('button');
      btnLock.type = 'button';
      btnLock.className = 'mon-btn-mini btn-lock';
      btnLock.title = 'Khóa/Mở khóa máy này';
      btnLock.innerHTML = /* sanitize */ '<i class="fas fa-lock"></i>';
      btnLock.onclick = (e) => {
        e.stopPropagation();
        if (STATE.seats[mId].screenState === 'LOCKED') {
          unlockMachine(mId);
        } else {
          lockMachine(mId);
        }
      };

      // Nút Thu bài
      const btnCollect = document.createElement('button');
      btnCollect.type = 'button';
      btnCollect.className = 'mon-btn-mini btn-collect';
      btnCollect.title = 'Thu bài tập từ máy này';
      btnCollect.innerHTML = /* sanitize */ '<i class="fas fa-file-download"></i>';
      btnCollect.onclick = (e) => { e.stopPropagation(); collectFiles(mId); };

      // Nút Tắt máy
      const btnPower = document.createElement('button');
      btnPower.type = 'button';
      btnPower.className = 'mon-btn-mini btn-power';
      btnPower.title = 'Tắt máy này';
      btnPower.innerHTML = /* sanitize */ '<i class="fas fa-power-off"></i>';
      btnPower.onclick = (e) => { e.stopPropagation(); shutdownMachine(mId); };

      // Nút Khởi động lại máy
      const btnRestart = document.createElement('button');
      btnRestart.type = 'button';
      btnRestart.className = 'mon-btn-mini btn-restart';
      btnRestart.title = 'Khởi động lại máy này';
      btnRestart.innerHTML = /* sanitize */ '<i class="fas fa-sync-alt"></i>';
      btnRestart.onclick = (e) => { e.stopPropagation(); restartMachine(mId); };

      // Nút Khóa / Mở Internet riêng máy này
      const btnNet = document.createElement('button');
      btnNet.type = 'button';
      btnNet.className = 'mon-btn-mini btn-net';
      btnNet.title = 'Khóa/Mở kết nối Internet riêng cho máy này';
      btnNet.innerHTML = /* sanitize */ '<i class="fas fa-globe"></i>';
      btnNet.onclick = (e) => {
        e.stopPropagation();
        const currentBlocked = Boolean(STATE.seats[mId]?.netBlocked);
        setInternetLock(!currentBlocked, mId);
        if (STATE.seats[mId]) STATE.seats[mId].netBlocked = !currentBlocked;
        updateSeatCardUI(mId);
      };

      // Nút Wake-on-LAN bật nguồn riêng máy này (khi máy đang tắt)
      const btnWol = document.createElement('button');
      btnWol.type = 'button';
      btnWol.className = 'mon-btn-mini btn-wol-single';
      btnWol.title = `Bật nguồn máy ${mId} từ xa qua chuẩn Wake-on-LAN`;
      btnWol.innerHTML = /* sanitize */ '<i class="fas fa-bolt"></i>';
      btnWol.onclick = (e) => {
        e.stopPropagation();
        wakeOnLan(mId);
      };

      actions.appendChild(btnSpotlight);
      actions.appendChild(btnLock);
      actions.appendChild(btnNet);
      actions.appendChild(btnCollect);
      actions.appendChild(btnWol);
      actions.appendChild(btnPower);
      actions.appendChild(btnRestart);

      footer.appendChild(meta);
      footer.appendChild(actions);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);

      gridContainer.appendChild(card);

      // Vẽ placeholder ban đầu
      drawOfflinePlaceholder(canvas, mId);
    }
  }

  function bindToolbarEvents() {
    const btnBroadcastStart = document.getElementById('btn-mon-broadcast-start');
    if (btnBroadcastStart) btnBroadcastStart.onclick = () => startTeacherBroadcast();

    const btnBroadcastStop = document.getElementById('btn-mon-broadcast-stop');
    if (btnBroadcastStop) btnBroadcastStop.onclick = () => stopTeacherBroadcast(true);

    const btnWolAll = document.getElementById('btn-mon-wol-all');
    if (btnWolAll) btnWolAll.onclick = () => wakeOnLan('ALL');

    const btnLockAll = document.getElementById('btn-mon-lock-all');
    if (btnLockAll) btnLockAll.onclick = () => lockMachine('ALL');

    const btnUnlockAll = document.getElementById('btn-mon-unlock-all');
    if (btnUnlockAll) btnUnlockAll.onclick = () => unlockMachine('ALL');

    const btnCollectAll = document.getElementById('btn-mon-collect-all');
    if (btnCollectAll) btnCollectAll.onclick = () => collectFiles('ALL');

    const btnShutdownAll = document.getElementById('btn-mon-shutdown-all');
    if (btnShutdownAll) btnShutdownAll.onclick = () => shutdownMachine('ALL');

    const btnRestartAll = document.getElementById('btn-mon-restart-all');
    if (btnRestartAll) btnRestartAll.onclick = () => restartMachine('ALL');

    const btnBlockNet = document.getElementById('btn-mon-block-net');
    if (btnBlockNet) btnBlockNet.onclick = () => setInternetLock(true, 'ALL');

    const btnUnblockNet = document.getElementById('btn-mon-unblock-net');
    if (btnUnblockNet) btnUnblockNet.onclick = () => setInternetLock(false, 'ALL');

    // Sự kiện mở modal Thông tin tác giả & Bản quyền
    const btnAuthor = document.getElementById('btn-open-author-info');
    const modalAuthor = document.getElementById('modal-author-info');
    const btnCloseAuthor = document.getElementById('btn-close-author-modal');
    const btnAuthorUnderstood = document.getElementById('btn-author-understood');

    if (btnAuthor && modalAuthor) {
      btnAuthor.onclick = () => { modalAuthor.style.display = 'flex'; };
    }
    if (btnCloseAuthor && modalAuthor) {
      btnCloseAuthor.onclick = () => { modalAuthor.style.display = 'none'; };
    }
    if (btnAuthorUnderstood && modalAuthor) {
      btnAuthorUnderstood.onclick = () => { modalAuthor.style.display = 'none'; };
    }
    if (modalAuthor) {
      modalAuthor.onclick = (e) => {
        if (e.target === modalAuthor) modalAuthor.style.display = 'none';
      };
    }

    const btnReconnect = document.getElementById('btn-mon-reconnect');
    if (btnReconnect) btnReconnect.onclick = () => {
      if (STATE.socket) STATE.socket.close();
      initWebSocket();
    };

    const btnCloseSpotlight = document.getElementById('btn-close-spotlight-modal');
    if (btnCloseSpotlight) btnCloseSpotlight.onclick = () => toggleSpotlight(STATE.activeSpotlight);

    const btnSpotlightLock = document.getElementById('btn-spotlight-lock');
    if (btnSpotlightLock) btnSpotlightLock.onclick = () => {
      if (STATE.activeSpotlight) lockMachine(STATE.activeSpotlight);
    };

    const btnSpotlightUnlock = document.getElementById('btn-spotlight-unlock');
    if (btnSpotlightUnlock) btnSpotlightUnlock.onclick = () => {
      if (STATE.activeSpotlight) unlockMachine(STATE.activeSpotlight);
    };

    const btnSpotlightCollect = document.getElementById('btn-spotlight-collect');
    if (btnSpotlightCollect) btnSpotlightCollect.onclick = () => {
      if (STATE.activeSpotlight) collectFiles(STATE.activeSpotlight);
    };
  }

  // ==========================================================================
  // 7. PUBLIC API & GẮN VÀO WINDOW
  // ==========================================================================
  window.LIVE_MONITOR = {
    init: function () {
      renderMonitorGrid();
      bindToolbarEvents();
      initWebSocket();
    },
    onTabOpen: function () {
      if (!STATE.isConnected) {
        initWebSocket();
      }
      // Làm mới danh sách học sinh theo lớp hiện tại
      Object.keys(STATE.seats).forEach(mId => updateSeatCardUI(mId));
      updateOverallStats();
    },
    refreshStudents: function () {
      Object.keys(STATE.seats).forEach(mId => updateSeatCardUI(mId));
    },
    wakeOnLan,
    lockMachine,
    unlockMachine,
    toggleSpotlight,
    collectFiles,
    shutdownMachine,
    restartMachine,
    setInternetLock,
    startTeacherBroadcast,
    stopTeacherBroadcast
  };

  // Tự động khởi tạo sau khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.LIVE_MONITOR.init());
  } else {
    setTimeout(() => window.LIVE_MONITOR.init(), 100);
  }

})();
