const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'freelancein.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('mahasiswa','umkm','admin')),
      name TEXT NOT NULL,
      univ TEXT,
      semester TEXT,
      skills TEXT,
      business_name TEXT,
      business_field TEXT,
      bio TEXT,
      hourly_rate INTEGER DEFAULT 75000,
      avatar_url TEXT,
      ktm_status TEXT DEFAULT 'pending' CHECK(ktm_status IN ('pending','submitted','verified','rejected')),
      ktm_file TEXT,
      portfolio TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      umkm_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      budget TEXT NOT NULL,
      category TEXT DEFAULT 'Web Dev',
      deadline TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','closed','filled')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      student_id INTEGER NOT NULL REFERENCES users(id),
      cover_letter TEXT NOT NULL,
      price TEXT NOT NULL,
      duration_days INTEGER DEFAULT 14,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(job_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      proposal_id INTEGER NOT NULL REFERENCES proposals(id),
      umkm_id INTEGER NOT NULL REFERENCES users(id),
      student_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      amount TEXT NOT NULL,
      step INTEGER DEFAULT 1,
      escrow_status TEXT DEFAULT 'none' CHECK(escrow_status IN ('none','pending','deposited','released')),
      midtrans_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER REFERENCES contracts(id),
      participant_a INTEGER NOT NULL REFERENCES users(id),
      participant_b INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES message_threads(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT,
      file_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL REFERENCES contracts(id),
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return;

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, name, univ, semester, skills, business_name, business_field, bio, hourly_rate, avatar_url, ktm_status, portfolio)
    VALUES (@email, @password_hash, @role, @name, @univ, @semester, @skills, @business_name, @business_field, @bio, @hourly_rate, @avatar_url, @ktm_status, @portfolio)
  `);

  insertUser.run({
    email: 'admin@freelancein.com',
    password_hash: hash('admin123'),
    role: 'admin',
    name: 'Admin FreelanceIn',
    univ: null, semester: null, skills: null,
    business_name: null, business_field: null,
    bio: 'Moderator verifikasi KTM',
    hourly_rate: 0,
    avatar_url: null,
    ktm_status: 'verified',
    portfolio: '[]'
  });

  insertUser.run({
    email: 'budi@mahasiswa.ui.ac.id',
    password_hash: hash('password123'),
    role: 'mahasiswa',
    name: 'Budi Santoso',
    univ: 'Universitas Indonesia',
    semester: '6',
    skills: JSON.stringify(['Laravel', 'React', 'Node.js']),
    business_name: null, business_field: null,
    bio: 'Mahasiswa S1 Teknik Informatika UI. Spesialis backend Laravel & integrasi payment gateway.',
    hourly_rate: 85000,
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop',
    ktm_status: 'verified',
    portfolio: JSON.stringify([
      { title: 'E-Commerce POS System', tech: 'Laravel, MySQL', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=240&auto=format&fit=crop' },
      { title: 'Booking App Admin', tech: 'React, Node.js', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=240&auto=format&fit=crop' }
    ])
  });

  insertUser.run({
    email: 'hendra@majubersama.com',
    password_hash: hash('password123'),
    role: 'umkm',
    name: 'Hendra Wijaya',
    univ: null, semester: null, skills: null,
    business_name: 'CV Maju Bersama',
    business_field: 'Kuliner & F&B',
    bio: 'Owner warung kopi & roti lapis dengan 3 cabang di Jakarta Selatan.',
    hourly_rate: 0,
    avatar_url: null,
    ktm_status: 'verified',
    portfolio: '[]'
  });

  const budiId = db.prepare("SELECT id FROM users WHERE email = 'budi@mahasiswa.ui.ac.id'").get().id;
  const hendraId = db.prepare("SELECT id FROM users WHERE email = 'hendra@majubersama.com'").get().id;

  const insertJob = db.prepare(`
    INSERT INTO jobs (umkm_id, title, description, budget, category, deadline, status)
    VALUES (@umkm_id, @title, @description, @budget, @category, @deadline, @status)
  `);

  const job1 = insertJob.run({
    umkm_id: hendraId,
    title: 'Sistem POS Warung Kopi Modern',
    description: 'Dibutuhkan sistem kasir web-based untuk warung kopi dengan fitur struk thermal, manajemen stok bahan, dan laporan harian.',
    budget: 'Rp 4.500.000',
    category: 'Web Dev',
    deadline: '2026-06-30',
    status: 'filled'
  }).lastInsertRowid;

  insertJob.run({
    umkm_id: hendraId,
    title: 'Landing Page & Integrasi Chat WA',
    description: 'Landing page penjualan produk keripik singkong dengan Laravel. Harus terhubung ke chat WhatsApp untuk pemesanan.',
    budget: 'Rp 1.500.000',
    category: 'Web Dev',
    deadline: '2026-07-15',
    status: 'open'
  });

  insertJob.run({
    umkm_id: hendraId,
    title: 'Desain UI E-Commerce Hijab',
    description: 'Desain 5 halaman: Home, Catalog, Product Detail, Cart, Checkout. Gaya modern minimalis.',
    budget: 'Rp 2.000.000',
    category: 'UI/UX',
    deadline: '2026-07-20',
    status: 'open'
  });

  const proposalId = db.prepare(`
    INSERT INTO proposals (job_id, student_id, cover_letter, price, duration_days, status)
    VALUES (?, ?, ?, ?, ?, 'accepted')
  `).run(job1, budiId, 'Saya berpengalaman membangun POS Laravel dengan integrasi printer thermal. Estimasi 3 minggu pengerjaan.', 'Rp 4.500.000', 21).lastInsertRowid;

  const contractId = db.prepare(`
    INSERT INTO contracts (job_id, proposal_id, umkm_id, student_id, title, amount, step, escrow_status)
    VALUES (?, ?, ?, ?, ?, ?, 3, 'deposited')
  `).run(job1, proposalId, hendraId, budiId, 'Sistem POS Warung Kopi Modern', 'Rp 4.500.000').lastInsertRowid;

  const threadId = db.prepare(`
    INSERT INTO message_threads (contract_id, participant_a, participant_b)
    VALUES (?, ?, ?)
  `).run(contractId, hendraId, budiId).lastInsertRowid;

  const insertMsg = db.prepare(`INSERT INTO messages (thread_id, sender_id, text) VALUES (?, ?, ?)`);
  insertMsg.run(threadId, budiId, 'Halo Pak Hendra. Saya sudah mengoptimasi query database untuk sistem POS kasir warung kopi Bapak.');
  insertMsg.run(threadId, hendraId, 'Bagus Budi, terima kasih. Apakah struk transaksinya sudah responsive saat dicetak?');
  insertMsg.run(threadId, budiId, 'Sudah pak, saya menggunakan media query print CSS khusus agar struk rapi di kertas thermal kasir 80mm.');

  db.prepare(`INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)`).run(
    hendraId, 'Proposal Baru', 'Budi Santoso mengajukan proposal untuk Sistem POS Warung Kopi Modern', 'proposals.html?job=' + job1
  );
}

initSchema();
seedIfEmpty();

module.exports = db;
