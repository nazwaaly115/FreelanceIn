# FreelanceIn — Stack Teknologi

## Keputusan Stack (Fase MVP)

| Lapisan | Teknologi | Alasan |
|---------|-----------|--------|
| **Frontend** | HTML/CSS/JS (FIDS design system) | Mempertahankan prototype UI yang sudah ada |
| **Backend API** | Node.js + Express | Ringan, cocok untuk MVP marketplace |
| **Database** | SQLite (`better-sqlite3`) | Tanpa setup DB server terpisah, mudah untuk development |
| **Auth** | JWT (JSON Web Token) | Session stateless, cocok untuk SPA/static frontend |
| **File upload** | Multer → `uploads/` | KTM & deliverable proyek |
| **Chat** | REST + polling (3 detik) | Persisten tanpa WebSocket; siap diganti Socket.io |
| **Escrow** | State machine internal + Midtrans Snap (sandbox) | Simulasi rekening bersama dengan opsi gateway nyata |

## Arsitektur

```
Browser (HTML pages + js/api.js)
        │
        ▼ HTTP /api/*
Express Server (server/index.js)
        │
        ├── SQLite (server/data/freelancein.db)
        ├── uploads/ (KTM, files)
        └── Midtrans API (opsional, via MIDTRANS_SERVER_KEY)
```

## Endpoint API Utama

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/POST /api/jobs`, `GET /api/jobs/:id`
- `POST /api/proposals`, `GET /api/proposals/job/:jobId`, `PATCH /api/proposals/:id/accept|reject`
- `GET /api/contracts/:id`, `PATCH /api/contracts/:id/step`, `POST /api/contracts/:id/deposit|release`
- `GET/POST /api/messages/threads/:id`
- `GET /api/notifications`
- `POST /api/ktm/submit`, `GET /api/ktm/pending`, `PATCH /api/ktm/:userId/approve|reject`
- `POST /api/escrow/snap-token` (Midtrans sandbox)

## Migrasi ke Production

1. Ganti SQLite → PostgreSQL (Supabase/Railway)
2. Deploy Express ke Railway/Render/Fly.io
3. Aktifkan Midtrans production keys
4. Tambah Socket.io untuk chat realtime
5. (Opsional) Migrasi frontend ke Next.js/React jika skala tim membutuhkan

## Menjalankan

```bash
npm install
npm run dev    # API + static server di http://localhost:3000
```
