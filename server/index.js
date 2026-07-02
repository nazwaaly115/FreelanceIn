require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');
const { signToken, authRequired, roleRequired, publicUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, '..')));

function notify(userId, title, message, link = null) {
  db.prepare('INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)').run(userId, title, message, link);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function parseUserFields(user) {
  const u = publicUser(user);
  return u;
}

// ---- AUTH ----
app.post('/api/auth/register', (req, res) => {
  const { email, password, role, name, univ, semester, skills, businessName, businessField } = req.body;
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Email, password, role, dan name wajib diisi' });
  }
  if (!['mahasiswa', 'umkm'].includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

  const result = db.prepare(`
    INSERT INTO users (email, password_hash, role, name, univ, semester, skills, business_name, business_field, ktm_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    email.toLowerCase(),
    bcrypt.hashSync(password, 10),
    role,
    name,
    univ || null,
    semester || null,
    skills ? JSON.stringify(Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : null,
    businessName || null,
    businessField || null
  );

  const user = getUserById(result.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ token, user: parseUserFields(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Email atau kata sandi salah' });
  }
  if (role && user.role !== role) {
    return res.status(403).json({ error: 'Peran akun tidak sesuai dengan pilihan login' });
  }
  const token = signToken(user);
  res.json({ token, user: parseUserFields(user) });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json({ user: parseUserFields(user) });
});

// ---- PROFILE ----
app.get('/api/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json({ user: parseUserFields(user) });
});

app.get('/api/users', (req, res) => {
  const { role, search, verified } = req.query;
  let sql = "SELECT * FROM users WHERE role = 'mahasiswa'";
  const params = [];
  if (verified === 'true') { sql += " AND ktm_status = 'verified'"; }
  if (search) {
    sql += ' AND (name LIKE ? OR skills LIKE ? OR univ LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  sql += ' ORDER BY created_at DESC';
  const users = db.prepare(sql).all(...params).map(parseUserFields);
  res.json({ users });
});

app.put('/api/profile', authRequired, (req, res) => {
  const { bio, skills, hourly_rate, portfolio, name } = req.body;
  const user = getUserById(req.user.id);
  db.prepare(`
    UPDATE users SET bio = ?, skills = ?, hourly_rate = ?, portfolio = ?, name = ?
    WHERE id = ?
  `).run(
    bio ?? user.bio,
    skills ? JSON.stringify(skills) : user.skills,
    hourly_rate ?? user.hourly_rate,
    portfolio ? JSON.stringify(portfolio) : user.portfolio,
    name ?? user.name,
    req.user.id
  );
  res.json({ user: parseUserFields(getUserById(req.user.id)) });
});

// ---- KTM ----
app.post('/api/ktm/submit', authRequired, roleRequired('mahasiswa'), upload.single('ktm'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File KTM wajib diunggah' });
  db.prepare("UPDATE users SET ktm_status = 'submitted', ktm_file = ? WHERE id = ?").run(req.file.filename, req.user.id);
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  admins.forEach(a => notify(a.id, 'Verifikasi KTM Baru', `${req.user.email} mengajukan verifikasi KTM`, 'admin.html'));
  res.json({ message: 'KTM berhasil diunggah, menunggu verifikasi admin', user: parseUserFields(getUserById(req.user.id)) });
});

app.get('/api/ktm/pending', authRequired, roleRequired('admin'), (_req, res) => {
  const pending = db.prepare("SELECT * FROM users WHERE role = 'mahasiswa' AND ktm_status IN ('submitted','pending') ORDER BY created_at DESC").all().map(parseUserFields);
  res.json({ students: pending });
});

app.patch('/api/ktm/:userId/approve', authRequired, roleRequired('admin'), (req, res) => {
  db.prepare("UPDATE users SET ktm_status = 'verified' WHERE id = ?").run(req.params.userId);
  notify(req.params.userId, 'KTM Terverifikasi', 'Selamat! Kartu mahasiswa Anda telah diverifikasi.', 'profile.html');
  res.json({ message: 'KTM disetujui' });
});

app.patch('/api/ktm/:userId/reject', authRequired, roleRequired('admin'), (req, res) => {
  db.prepare("UPDATE users SET ktm_status = 'rejected' WHERE id = ?").run(req.params.userId);
  notify(req.params.userId, 'KTM Ditolak', req.body.reason || 'Berkas KTM tidak valid. Silakan unggah ulang.', 'register-mahasiswa.html');
  res.json({ message: 'KTM ditolak' });
});

// ---- JOBS ----
app.get('/api/jobs', (req, res) => {
  const { search, category, status } = req.query;
  let sql = `
    SELECT j.*, u.name as umkm_name, u.business_name,
      (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) as proposal_count
    FROM jobs j JOIN users u ON j.umkm_id = u.id WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND j.status = ?'; params.push(status); }
  else { sql += " AND j.status = 'open'"; }
  if (category) { sql += ' AND j.category = ?'; params.push(category); }
  if (search) {
    sql += ' AND (j.title LIKE ? OR j.description LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q);
  }
  sql += ' ORDER BY j.created_at DESC';
  res.json({ jobs: db.prepare(sql).all(...params) });
});

app.get('/api/jobs/mine', authRequired, roleRequired('umkm'), (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*,
      (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id AND p.status = 'pending') as pending_proposals,
      (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) as proposal_count
    FROM jobs j WHERE j.umkm_id = ? ORDER BY j.created_at DESC
  `).all(req.user.id);
  res.json({ jobs });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, u.name as umkm_name, u.business_name, u.business_field
    FROM jobs j JOIN users u ON j.umkm_id = u.id WHERE j.id = ?
  `).get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' });
  res.json({ job });
});

app.post('/api/jobs', authRequired, roleRequired('umkm'), (req, res) => {
  const { title, description, budget, category, deadline } = req.body;
  if (!title || !description || !budget) {
    return res.status(400).json({ error: 'Judul, deskripsi, dan anggaran wajib diisi' });
  }
  const result = db.prepare(`
    INSERT INTO jobs (umkm_id, title, description, budget, category, deadline)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, description, budget, category || 'Web Dev', deadline || null);
  res.status(201).json({ job: db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid) });
});

// ---- PROPOSALS ----
app.post('/api/proposals', authRequired, roleRequired('mahasiswa'), (req, res) => {
  const { job_id, cover_letter, price, duration_days } = req.body;
  const user = getUserById(req.user.id);
  if (user.ktm_status !== 'verified') {
    return res.status(403).json({ error: 'Verifikasi KTM diperlukan sebelum mengirim proposal' });
  }
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND status = ?').get(job_id, 'open');
  if (!job) return res.status(404).json({ error: 'Lowongan tidak tersedia' });
  try {
    const result = db.prepare(`
      INSERT INTO proposals (job_id, student_id, cover_letter, price, duration_days)
      VALUES (?, ?, ?, ?, ?)
    `).run(job_id, req.user.id, cover_letter, price, duration_days || 14);
    notify(job.umkm_id, 'Proposal Baru', `${user.name} mengajukan proposal untuk "${job.title}"`, `proposals.html?job=${job_id}`);
    res.status(201).json({ proposal: db.prepare('SELECT * FROM proposals WHERE id = ?').get(result.lastInsertRowid) });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Anda sudah mengajukan proposal untuk lowongan ini' });
    throw e;
  }
});

app.get('/api/proposals/mine', authRequired, roleRequired('mahasiswa'), (req, res) => {
  const proposals = db.prepare(`
    SELECT p.*, j.title as job_title, u.business_name, u.name as umkm_name
    FROM proposals p
    JOIN jobs j ON p.job_id = j.id
    JOIN users u ON j.umkm_id = u.id
    WHERE p.student_id = ? ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json({ proposals });
});

app.get('/api/proposals/job/:jobId', authRequired, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Lowongan tidak ditemukan' });
  if (job.umkm_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  const proposals = db.prepare(`
    SELECT p.*, u.name as student_name, u.univ, u.skills, u.avatar_url, u.ktm_status, u.hourly_rate
    FROM proposals p JOIN users u ON p.student_id = u.id
    WHERE p.job_id = ? ORDER BY p.created_at DESC
  `).all(req.params.jobId).map(p => ({ ...p, skills: JSON.parse(p.skills || '[]') }));
  res.json({ job, proposals });
});

app.patch('/api/proposals/:id/accept', authRequired, roleRequired('umkm'), (req, res) => {
  const proposal = db.prepare('SELECT p.*, j.umkm_id, j.title FROM proposals p JOIN jobs j ON p.job_id = j.id WHERE p.id = ?').get(req.params.id);
  if (!proposal || proposal.umkm_id !== req.user.id) return res.status(404).json({ error: 'Proposal tidak ditemukan' });
  db.prepare("UPDATE proposals SET status = 'accepted' WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE proposals SET status = 'rejected' WHERE job_id = ? AND id != ?").run(proposal.job_id, req.params.id);
  db.prepare("UPDATE jobs SET status = 'filled' WHERE id = ?").run(proposal.job_id);
  const contractResult = db.prepare(`
    INSERT INTO contracts (job_id, proposal_id, umkm_id, student_id, title, amount, step, escrow_status)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'none')
  `).run(proposal.job_id, proposal.id, proposal.umkm_id, proposal.student_id, proposal.title, proposal.price);
  const contractId = contractResult.lastInsertRowid;
  db.prepare(`
    INSERT INTO message_threads (contract_id, participant_a, participant_b) VALUES (?, ?, ?)
  `).run(contractId, proposal.umkm_id, proposal.student_id);
  notify(proposal.student_id, 'Proposal Diterima!', `Proposal Anda untuk "${proposal.title}" diterima. Lanjut ke kontrak.`, `project-tracking.html?contract=${contractId}`);
  res.json({ message: 'Proposal diterima, kontrak dibuat', contractId });
});

app.patch('/api/proposals/:id/reject', authRequired, roleRequired('umkm'), (req, res) => {
  const proposal = db.prepare('SELECT p.*, j.umkm_id, j.title FROM proposals p JOIN jobs j ON p.job_id = j.id WHERE p.id = ?').get(req.params.id);
  if (!proposal || proposal.umkm_id !== req.user.id) return res.status(404).json({ error: 'Proposal tidak ditemukan' });
  db.prepare("UPDATE proposals SET status = 'rejected' WHERE id = ?").run(req.params.id);
  notify(proposal.student_id, 'Proposal Ditolak', `Proposal untuk "${proposal.title}" belum diterima klien.`, 'student-dashboard.html');
  res.json({ message: 'Proposal ditolak' });
});

// ---- CONTRACTS & ESCROW ----
app.get('/api/contracts/mine', authRequired, (req, res) => {
  let contracts;
  if (req.user.role === 'umkm') {
    contracts = db.prepare(`
      SELECT c.*, u.name as student_name FROM contracts c
      JOIN users u ON c.student_id = u.id WHERE c.umkm_id = ? ORDER BY c.created_at DESC
    `).all(req.user.id);
  } else if (req.user.role === 'mahasiswa') {
    contracts = db.prepare(`
      SELECT c.*, u.business_name, u.name as umkm_name FROM contracts c
      JOIN users u ON c.umkm_id = u.id WHERE c.student_id = ? ORDER BY c.created_at DESC
    `).all(req.user.id);
  } else {
    contracts = db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
  }
  res.json({ contracts });
});

app.get('/api/contracts/:id', authRequired, (req, res) => {
  const contract = db.prepare(`
    SELECT c.*, j.description as job_description,
      s.name as student_name, s.avatar_url as student_avatar,
      u.name as umkm_name, u.business_name
    FROM contracts c
    JOIN jobs j ON c.job_id = j.id
    JOIN users s ON c.student_id = s.id
    JOIN users u ON c.umkm_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Kontrak tidak ditemukan' });
  if (req.user.role !== 'admin' && req.user.id !== contract.umkm_id && req.user.id !== contract.student_id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  res.json({ contract });
});

app.patch('/api/contracts/:id/step', authRequired, (req, res) => {
  const { step } = req.body;
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Kontrak tidak ditemukan' });
  if (req.user.id !== contract.umkm_id && req.user.id !== contract.student_id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  db.prepare('UPDATE contracts SET step = ? WHERE id = ?').run(step, req.params.id);
  res.json({ contract: db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) });
});

app.post('/api/contracts/:id/deposit', authRequired, roleRequired('umkm'), (req, res) => {
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!contract || contract.umkm_id !== req.user.id) return res.status(404).json({ error: 'Kontrak tidak ditemukan' });
  db.prepare("UPDATE contracts SET escrow_status = 'deposited', step = CASE WHEN step < 2 THEN 2 ELSE step END WHERE id = ?").run(req.params.id);
  notify(contract.student_id, 'Escrow Aktif', 'Dana proyek telah didepositkan ke Rekening Bersama.', `project-tracking.html?contract=${contract.id}`);
  res.json({ message: 'Dana berhasil didepositkan ke Rekening Bersama', escrow_status: 'deposited' });
});

app.post('/api/contracts/:id/release', authRequired, roleRequired('umkm'), (req, res) => {
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!contract || contract.umkm_id !== req.user.id) return res.status(404).json({ error: 'Kontrak tidak ditemukan' });
  db.prepare("UPDATE contracts SET escrow_status = 'released', step = 5 WHERE id = ?").run(req.params.id);
  notify(contract.student_id, 'Dana Dilepaskan', 'Pembayaran proyek telah dilepaskan ke dompet Anda.', 'student-dashboard.html');
  res.json({ message: 'Dana berhasil dilepaskan ke mahasiswa', escrow_status: 'released' });
});

app.post('/api/contracts/:id/review', authRequired, (req, res) => {
  const { rating, comment } = req.body;
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!contract) return res.status(404).json({ error: 'Kontrak tidak ditemukan' });
  db.prepare('INSERT INTO reviews (contract_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)').run(
    contract.id, req.user.id, rating, comment || ''
  );
  res.json({ message: 'Ulasan berhasil disimpan' });
});

// ---- MIDTRANS ESCROW (Sandbox) ----
app.post('/api/escrow/snap-token', authRequired, roleRequired('umkm'), async (req, res) => {
  const { contract_id } = req.body;
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract_id);
  if (!contract || contract.umkm_id !== req.user.id) return res.status(404).json({ error: 'Kontrak tidak ditemukan' });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const amount = parseInt(String(contract.amount).replace(/\D/g, ''), 10) || 4500000;
  const orderId = `FI-${contract.id}-${Date.now()}`;

  if (!serverKey || serverKey.includes('xxxxxxxx')) {
  db.prepare("UPDATE contracts SET midtrans_order_id = ?, escrow_status = 'deposited', step = CASE WHEN step < 2 THEN 2 ELSE step END WHERE id = ?").run(orderId, contract.id);
    notify(contract.student_id, 'Escrow Aktif (Simulasi)', 'Pembayaran simulasi berhasil. Dana aman di Rekening Bersama.', `project-tracking.html?contract=${contract.id}`);
    return res.json({ simulated: true, order_id: orderId, message: 'Pembayaran simulasi berhasil (Midtrans sandbox belum dikonfigurasi)' });
  }

  try {
    const auth = Buffer.from(serverKey + ':').toString('base64');
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: { email: req.user.email }
      })
    });
    const data = await response.json();
    if (data.token) {
      db.prepare('UPDATE contracts SET midtrans_order_id = ? WHERE id = ?').run(orderId, contract.id);
      return res.json({ token: data.token, order_id: orderId, client_key: process.env.MIDTRANS_CLIENT_KEY });
    }
    return res.status(502).json({ error: 'Gagal membuat token Midtrans', detail: data });
  } catch (err) {
    return res.status(502).json({ error: 'Kesalahan gateway pembayaran', detail: err.message });
  }
});

// ---- MESSAGES ----
app.get('/api/messages/threads', authRequired, (req, res) => {
  const threads = db.prepare(`
    SELECT t.*,
      CASE WHEN t.participant_a = ? THEN pb.name ELSE pa.name END as partner_name,
      CASE WHEN t.participant_a = ? THEN pb.role ELSE pa.role END as partner_role,
      CASE WHEN t.participant_a = ? THEN t.participant_b ELSE t.participant_a END as partner_id,
      (SELECT text FROM messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) as last_at
    FROM message_threads t
    JOIN users pa ON t.participant_a = pa.id
    JOIN users pb ON t.participant_b = pb.id
    WHERE t.participant_a = ? OR t.participant_b = ?
    ORDER BY last_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json({ threads });
});

app.get('/api/messages/threads/:id', authRequired, (req, res) => {
  const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(req.params.id);
  if (!thread) return res.status(404).json({ error: 'Thread tidak ditemukan' });
  if (thread.participant_a !== req.user.id && thread.participant_b !== req.user.id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  const since = req.query.since;
  let messages;
  if (since) {
    messages = db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.thread_id = ? AND m.created_at > ? ORDER BY m.created_at ASC').all(req.params.id, since);
  } else {
    messages = db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.thread_id = ? ORDER BY m.created_at ASC').all(req.params.id);
  }
  res.json({ thread, messages });
});

app.post('/api/messages/threads/:id', authRequired, upload.single('file'), (req, res) => {
  const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(req.params.id);
  if (!thread) return res.status(404).json({ error: 'Thread tidak ditemukan' });
  if (thread.participant_a !== req.user.id && thread.participant_b !== req.user.id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  const text = req.body.text || '';
  const fileName = req.file ? req.file.filename : null;
  if (!text && !fileName) return res.status(400).json({ error: 'Pesan atau file wajib diisi' });
  const result = db.prepare('INSERT INTO messages (thread_id, sender_id, text, file_name) VALUES (?, ?, ?, ?)').run(
    req.params.id, req.user.id, text, fileName
  );
  const partnerId = thread.participant_a === req.user.id ? thread.participant_b : thread.participant_a;
  notify(partnerId, 'Pesan Baru', text ? text.substring(0, 80) : 'Berkas baru dikirim', `messages.html?thread=${req.params.id}`);
  const msg = db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: msg });
});

// ---- NOTIFICATIONS ----
app.get('/api/notifications', authRequired, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).c;
  res.json({ notifications, unread });
});

app.patch('/api/notifications/:id/read', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.patch('/api/notifications/read-all', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`FreelanceIn server running at http://localhost:${PORT}`);
});
