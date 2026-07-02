# FreelanceIn

Marketplace dua sisi yang menghubungkan **UMKM** (pencari jasa IT) dengan **Mahasiswa** (penyedia jasa) di Indonesia.

## Fitur

- Registrasi & login UMKM / Mahasiswa / Admin
- Posting lowongan proyek (UMKM) — persisten di database
- Halaman **Cari Proyek** untuk mahasiswa (`projects.html`)
- Kirim proposal → review UMKM → hire → kontrak
- Escrow / Rekening Bersama (simulasi + Midtrans Snap sandbox)
- Chat persisten antar UMKM & mahasiswa (polling 3 detik)
- Upload & verifikasi KTM (`admin.html`)
- Notifikasi in-app
- Halaman legal: About, S&K, Privasi, FAQ Escrow

## Stack

Lihat [STACK.md](STACK.md) untuk detail arsitektur.

- Frontend: HTML/CSS/JS (FIDS Design System)
- Backend: Node.js + Express + SQLite
- Auth: JWT

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Salin environment
cp .env.example .env

# 3. Jalankan server (API + static files)
npm run dev
```

Buka **http://localhost:3000**

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Mahasiswa | budi@mahasiswa.ui.ac.id | password123 |
| UMKM | hendra@majubersama.com | password123 |
| Admin | admin@freelancein.com | admin123 |

## Alur Pengguna

### UMKM (pencari jasa)
1. Login → Dashboard UMKM
2. Posting kebutuhan jasa
3. Review proposal di `proposals.html?job={id}`
4. Terima proposal → kontrak di `project-tracking.html?contract={id}`
5. Deposit escrow → review deliverable → lepas dana

### Mahasiswa (penyedia jasa)
1. Daftar + upload KTM
2. Tunggu verifikasi admin
3. Cari proyek di `projects.html`
4. Kirim proposal
5. Kerjakan proyek setelah hire → terima pembayaran

## Midtrans (Opsional)

Setel di `.env`:
```
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
```

Tanpa konfigurasi, escrow berjalan dalam mode simulasi.

## Deployment Production

1. Set `JWT_SECRET` ke string acak ≥ 32 karakter
2. Deploy ke Railway/Render/VPS dengan Node.js 18+
3. Ganti SQLite → PostgreSQL untuk skala production (lihat STACK.md)
4. Set `PORT` environment variable
5. Aktifkan HTTPS reverse proxy (nginx/Caddy)

```bash
npm start
```

## Struktur Proyek

```
├── server/           # Express API + SQLite
├── js/api.js         # Client API wrapper
├── projects.html     # Cari Proyek (mahasiswa)
├── proposals.html    # Review proposal (UMKM)
├── admin.html        # Verifikasi KTM
├── about.html        # Halaman legal & info
└── css/              # FIDS design system
```

## Lisensi

ISC — FreelanceIn Team © 2026
