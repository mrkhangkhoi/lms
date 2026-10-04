/**
 * CVALMS PRO - SELF-STUDY 18-DESK REALTIME MONITOR
 * Real-time LAN telemetry, teacher override controls & CSV/Excel reporting
 */

const sanitizeHTML = (h) => (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(h) : h);

class SelfStudyMonitor {
  constructor(options = {}) {
    this.gatewayUrl = options.gatewayUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:49150');
    this.pollIntervalId = null;
    this.desksData = this.getDesksTemplate();
  }

  getDesksTemplate() {
    const map = {};
    for (let i = 1; i <= 18; i++) {
      const id = `MAY-${String(i).padStart(2, '0')}`;
      map[id] = {
        deskId: id,
        studentName: 'Chưa vào',
        lessonId: '',
        step: 0,
        score: '0/0',
        completed: false,
        status: 'offline',
        updatedAt: 0
      };
    }
    return map;
  }

  mergeLiveProgress(liveState) {
    const template = this.getDesksTemplate();
    if (!liveState || !liveState.desks) return template;

    Object.keys(template).forEach(deskId => {
      if (liveState.desks[deskId]) {
        const live = liveState.desks[deskId];
        template[deskId] = {
          ...template[deskId],
          ...live,
          status: 'online'
        };
      }
    });

    this.desksData = template;
    return template;
  }

  generateProgressCSV(desksMap) {
    const data = desksMap || this.desksData;
    const rows = [
      ['Số Máy', 'Họ Và Tên Học Sinh', 'Bài Học', 'Bước Hoàn Thành', 'Điểm Đánh Giá', 'Trạng Thái', 'Thời Gian Cập Nhật']
    ];

    Object.values(data).forEach(d => {
      const updateStr = d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString('vi-VN') : '---';
      const statusStr = d.completed ? 'Đã hoàn thành' : (d.status === 'online' ? 'Đang học' : 'Chưa tham gia');
      rows.push([
        d.deskId,
        `"${(d.studentName || '').replace(/"/g, '""')}"`,
        d.lessonId || '---',
        `Bước ${d.step}/4`,
        d.score || '0/0',
        statusStr,
        updateStr
      ]);
    });

    return '\uFEFF' + rows.map(r => r.join(',')).join('\n');
  }

  onTabOpen() {
    if (typeof window === 'undefined') return;
    this.fetchAndUpdate();
    if (!this.pollIntervalId) {
      this.pollIntervalId = setInterval(() => this.fetchAndUpdate(), 2500);
    }
  }

  onTabClose() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  async fetchAndUpdate() {
    if (typeof fetch === 'undefined') return;
    try {
      const res = await fetch(`${this.gatewayUrl}/api/self-study/live-progress`);
      if (res.ok) {
        const data = await res.json();
        const merged = this.mergeLiveProgress(data);
        this.renderDesksGrid(merged);
      }
    } catch (e) {
      // Offline fallback
    }
  }

  renderDesksGrid(desksMap) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('selfstudy-grid-desks');
    if (!container) return;

    container.innerHTML = sanitizeHTML('');
    Object.values(desksMap).forEach(d => {
      const card = document.createElement('div');
      card.className = 'desk-card-item';
      card.style.cssText = `
        background: #1e293b;
        border: 1px solid ${d.completed ? '#10b981' : (d.status === 'online' ? '#38bdf8' : '#334155')};
        border-radius: 10px;
        padding: 14px;
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 6px;
      `;

      const pct = Math.round((d.step / 4) * 100);
      const badgeBg = d.completed ? '#10b981' : (d.status === 'online' ? '#0284c7' : '#475569');

      card.innerHTML = sanitizeHTML(`
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 15px; color: #38bdf8;">${d.deskId}</strong>
          <span style="background: ${badgeBg}; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">
            ${d.completed ? 'HOÀN THÀNH' : (d.status === 'online' ? 'ĐANG HỌC' : 'CHƯA VÀO')}
          </span>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          👤 ${d.studentName}
        </div>
        <div style="font-size: 12px; color: #94a3b8;">
          📖 ${d.lessonId || '---'}
        </div>
        <div style="margin-top: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 2px;">
            <span>Tiến độ: Bước ${d.step}/4</span>
            <span style="font-weight: 700; color: #10b981;">${pct}%</span>
          </div>
          <div style="height: 6px; background: #334155; border-radius: 9999px; overflow: hidden;">
            <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #38bdf8, #10b981);"></div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px;">
          <span>Điểm: <b style="color: #fbbf24;">${d.score}</b></span>
          <span>${d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString('vi-VN') : ''}</span>
        </div>
      `);
      container.appendChild(card);
    });
  }

  async sendControl(command) {
    if (typeof fetch === 'undefined') return;
    try {
      const res = await fetch(`${this.gatewayUrl}/api/self-study/teacher-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });
      return await res.json();
    } catch (e) {
      console.error('Lỗi gửi điều khiển:', e);
    }
  }
}

// Global functions for inline HTML calls
if (typeof window !== 'undefined') {
  window.SELF_STUDY_MONITOR = new SelfStudyMonitor();
  window.selfStudySetControl = function(cmd) {
    window.SELF_STUDY_MONITOR.sendControl(cmd).then(() => {
      alert('✅ Đã cập nhật lệnh điều khiển phòng máy!');
    });
  };
  window.selfStudyExportProgressExcel = function() {
    const csvContent = window.SELF_STUDY_MONITOR.generateProgressCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CVALMS_TienDoTuHoc_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelfStudyMonitor;
}
