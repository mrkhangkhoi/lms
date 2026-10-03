const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_STORAGE_DIR = path.join(__dirname, 'storage', 'submissions');
const AUDIT_LOG_FILE = path.join(__dirname, 'storage', 'audit_log.jsonl');

function logAuditAction(entry) {
  try {
    const auditDir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    const line = JSON.stringify({
      ...entry,
      loggedAt: Date.now(),
      isoTime: new Date().toISOString()
    }) + '\n';
    fs.appendFileSync(AUDIT_LOG_FILE, line, 'utf8');
  } catch (err) {
    console.error('❌ Lỗi ghi nhật ký Audit Log:', err.message);
  }
}

class DurableCollectionStorage {
  constructor(storageDir = DEFAULT_STORAGE_DIR) {
    this.storageDir = storageDir;
    this.journalFile = path.join(this.storageDir, 'transactions.json');
    this.transactions = new Map();
    this.init();
  }

  init() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    if (fs.existsSync(this.journalFile)) {
      try {
        const raw = fs.readFileSync(this.journalFile, 'utf8');
        const parsed = JSON.parse(raw);
        for (const item of parsed) {
          this.transactions.set(item.submissionId, item);
        }
      } catch (err) {
        console.warn('⚠️ Cảnh báo đọc transactions.json:', err.message);
      }
    }
  }

  saveJournal() {
    try {
      const list = Array.from(this.transactions.values());
      const tempFile = `${this.journalFile}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf8');
      fs.renameSync(tempFile, this.journalFile);
    } catch (err) {
      console.error('❌ Lỗi ghi journal giao dịch:', err.message);
    }
  }

  createTransaction(submissionId, machineId, studentName, expectedHash, sessionEpochId) {
    // Idempotent check
    if (this.transactions.has(submissionId)) {
      const existing = this.transactions.get(submissionId);
      if (existing.expectedHash === expectedHash && existing.state === 'COMMITTED') {
        return { idempotent: true, transaction: existing };
      }
    }

    const tx = {
      submissionId,
      machineId,
      studentName: studentName || 'HocSinh',
      expectedHash,
      sessionEpochId,
      state: 'PREPARED',
      createdAt: Date.now(),
      committedAt: null,
      savedFile: null,
      fileSize: 0
    };

    this.transactions.set(submissionId, tx);
    this.saveJournal();
    return { idempotent: false, transaction: tx };
  }

  commitSubmission(submissionId, buffer, providedHash) {
    const tx = this.transactions.get(submissionId);
    if (!tx) {
      throw new Error(`Giao dịch không tồn tại: ${submissionId}`);
    }

    if (buffer.length > 50 * 1024 * 1024) {
      tx.state = 'FAILED';
      tx.error = 'Dung lượng file vượt quá giới hạn cho phép (50MB)';
      this.saveJournal();
      throw new Error(tx.error);
    }

    // Verify SHA-256 hash
    const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');
    if (providedHash && providedHash.toLowerCase() !== actualHash.toLowerCase()) {
      tx.state = 'FAILED';
      tx.error = `Mã băm SHA-256 không khớp! Nhận: ${providedHash}, Thực tế: ${actualHash}`;
      this.saveJournal();
      throw new Error(tx.error);
    }

    // Clean filename against path traversal & strange characters
    const cleanMachine = String(tx.machineId).replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanStudent = String(tx.studentName).replace(/[^a-zA-Z0-9_\u00C0-\u1EF9 -]/g, '').trim().replace(/\s+/g, '_');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const finalFilename = `${cleanMachine}_${cleanStudent}_${timestampStr}.zip`;
    const finalPath = path.join(this.storageDir, finalFilename);
    const partPath = `${finalPath}.part`;

    // Atomic write
    fs.writeFileSync(partPath, buffer);
    fs.renameSync(partPath, finalPath);

    tx.state = 'COMMITTED';
    tx.committedAt = Date.now();
    tx.savedFile = finalFilename;
    tx.fileSize = buffer.length;
    tx.contentHash = actualHash;
    this.saveJournal();

    return {
      success: true,
      submissionId,
      savedFile: finalFilename,
      size: buffer.length,
      contentHash: actualHash
    };
  }

  getSubmissionStatus(submissionId) {
    return this.transactions.get(submissionId) || null;
  }

  getAllSubmissions() {
    return Array.from(this.transactions.values());
  }
}

module.exports = { DurableCollectionStorage, logAuditAction };
