Aplikasi catatan modern menggunakan PostgreSQL, Express, React (Vite), Node.js dengan ES6 Modules.

## Fitur
- Autentikasi JWT (register & login)
- CRUD catatan lengkap
- Warna background per catatan (12 palet pastel)
- Pin catatan
- Arsipkan catatan
- Masonry grid layout
- Animasi dengan Framer Motion
- Responsif mobile-first

## Prasyarat
- Node.js 18+
- PostgreSQL (running di localhost:5432)

---

## Setup

### 1. Clone & konfigurasi .env
Edit file `.env` di root folder:
```
DATABASE_URL=postgresql://postgres:tanya_ke_arif@localhost:5432/db_notespace
JWT_SECRET=tanya_ke_arif
```

### 2. Buat database PostgreSQL
```bash
psql -U postgres
CREATE DATABASE db_notespace;
\q

psql -U postgres -d db_notespace -f server/schema.sql
```

### 3. Jalankan backend
```bash
cd server
npm install
npm run dev
# Berjalan di http://localhost:5000
```

### 4. Jalankan frontend (terminal baru)
```bash
cd client
npm install
npm run dev
# Berjalan di http://localhost:5173
```

### 5. Buka browser
Akses `http://localhost:5173` → daftar akun → mulai catat!

---

## Struktur API

| Method | Endpoint              | Auth | Deskripsi            |
|--------|-----------------------|------|----------------------|
| POST   | /api/auth/register    | -    | Daftar akun baru     |
| POST   | /api/auth/login       | -    | Login, dapat token   |
| GET    | /api/notes            | ✅   | Ambil semua catatan  |
| POST   | /api/notes            | ✅   | Buat catatan baru    |
| PUT    | /api/notes/:id        | ✅   | Update catatan       |
| DELETE | /api/notes/:id        | ✅   | Hapus catatan        |

---

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, react-masonry-css, lucide-react
- **Backend**: Node.js, Express 4, ES6 Modules
- **Database**: PostgreSQL dengan driver `pg`
- **Auth**: bcryptjs + jsonwebtoken (JWT)
