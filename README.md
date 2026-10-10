# Task Audit System (Mini Task Manager)

Mini Task Manager untuk tim internal dengan penekanan pada **transparansi perubahan data**, **kepatuhan alur kerja tim**, dan **jejak audit (audit log) yang tidak dapat dimanipulasi**.

---

### Konteks Produk & Masalah yang Diselesaikan
Dalam operasional tim internal sehari-hari, masalah yang sering terjadi adalah:
- **Status task sering berubah, namun tidak jelas siapa yang mengubahnya.**
- **Riwayat perubahan data sulit ditelusuri** saat terjadi kendala koordinasi atau salah paham antar anggota tim.
- **Tampilan antarmuka (UI) tidak cukup transparan** dalam menjelaskan kronologi perubahan status.

**Solusi Produk yang Dihadirkan**:
1. **Audit Trail**: Setiap perubahan status otomatis mencatat aktor, status asal, status tujuan, dan waktu perubahan secara jelas (contoh: *User "john.doe" changed Task "Invoice" from "pending" to "in_progress" at 2026-10-09 10:00*).
2. **Alur Kerja Terstandarisasi (Strict State Flow)**: Task hanya bisa bergerak maju secara bertahap (`to_do` $\rightarrow$ `pending` $\rightarrow$ `in_progress` $\rightarrow$ `done`), mencegah loncatan tahapan kerja tanpa koordinasi.
3. **Integritas Data Tanpa Hilang (Soft Delete & Append-Only)**: Riwayat audit bersifat permanen dan tidak dapat diubah atau dihapus oleh siapa pun, bahkan ketika task dihapus dari daftar aktif tim.

## 1. Cara Menjalankan Proyek

Aplikasi dapat dijalankan melalui **Opsi A (Docker Compose — 1 Perintah)** atau **Opsi B (Manual Local Development)**.

---

### Opsi A: Menjalankan via Docker Compose (Rekomendasi)

Pastikan Docker Desktop / daemon aktif, lalu jalankan perintah berikut di root folder:

```bash
docker compose up --build
```

Docker Compose akan otomatis:
1. Menyalakan container **PostgreSQL 16** dan menunggu healthcheck ready.
2. Mem-build backend, menjalankan migrasi database (`prisma migrate deploy`), dan menjalankan server di port `4000`.
3. Mem-build frontend dan menyajikannya via Nginx di port `3000` (dengan reverse-proxy otomatis untuk `/api`).

Akses layanan:
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

Untuk menghentikan:
```bash
docker compose down
```

---

### Opsi B: Menjalankan Secara Manual (Local Development)

#### Prasyarat
- Node.js (v18+)
- PostgreSQL aktif di port 5432
- npm (bawaan instalasi Node.js)

#### Langkah Setup:

```bash
# 1. Clone repository & install dependencies
git clone <repository-url>
cd <repository-folder>
npm install

# 2. Setup Database & Jalankan Backend
cd apps/backend
cp .env.example .env          # Configure DATABASE_URL if needed
npm run prisma:migrate        # Apply migrations to database
npm run dev                   # Runs on http://localhost:4000

# 3. Jalankan Frontend (di terminal terpisah)
cd apps/frontend
npm run dev                   # Runs on http://localhost:3000
```

Atau dari root folder langsung:
```bash
npm run dev:backend           # Terminal 1
npm run dev:frontend          # Terminal 2
```

### Menjalankan Automated Tests

Test suite di backend dirancang **100% database-agnostic** menggunakan `InMemoryPrismaClient`. Anda **tidak memerlukan database PostgreSQL atau Docker aktif** untuk menjalankan test:

```bash
# Dari root folder proyek
npm run test:backend

# Atau dari folder apps/backend
cd apps/backend && npm test
```

Suite pengujian mencakup 10 skenario end-to-end:
1. Pembuatan task baru dengan default status `to_do`.
2. Query list task aktif (memfilter task yang sudah di-soft delete).
3. Query filter status aktif via query parameter (`?status=...`).
4. Transisi sekuensial penuh `to_do -> pending -> in_progress -> done` beserta pembuatan audit log.
5. Penolakan transisi ilegal yang melompati urutan (HTTP 400).
6. Idempotensi update ke status yang sama (no-op, 0 audit log).
7. Rollback transaksi database saat insert audit log disimulasikan gagal.
8. Soft delete task dan verifikasi bahwa histori audit log tetap utuh.
9. Penanganan error 404 untuk task ID yang tidak ditemukan.
10. Penanganan race condition pada concurrent updates menggunakan optimistic locking.
---

## 2. Arsitektur & Struktur Proyek

Proyek ini menggunakan pendekatan **Feature-Based Architecture (Modular Monorepo)**:
- **Backend**: Node.js + Express + TypeScript dengan struktur modular per domain fitur (`modules/tasks` dan `modules/audit-logs`).
- **Frontend**: React + TypeScript + Vite dengan komponen terisolasi per fitur (`features/tasks` dan `features/audit-logs`).
```text
task-audit-system/
├── apps/
│   ├── frontend/             # React + Vite + TypeScript + Tailwind CSS
│   │   └── src/
│   │       ├── features/
│   │       │   ├── tasks/         # UI components, API client, & task types
│   │       │   └── audit-logs/    # Audit log components & API client
│   │       ├── shared/            # Shared components (Modal, StatusBadge, Alert) & constants
│   │       │   ├── components/
│   │       │   └── constants.ts
│   │       ├── App.tsx
│   │       └── main.tsx
│   └── backend/              # Node.js + Express + TypeScript + Prisma
│       ├── src/
│       │   ├── core/                  # Shared infrastructure (Config, Database, Errors, Logger, Middleware)
│       │   │   ├── config/            # Environment configuration
│       │   │   ├── database/          # PrismaService singleton & type wrapper
│       │   │   ├── errors/            # Custom AppError classes
│       │   │   ├── logger/            # Central Winston structured logger
│       │   │   └── middlewares/       # Request logger & error handler middlewares
│       │   ├── modules/               # Feature modules
│       │   │   ├── tasks/             # Task module (CRUD, status transitions, optimistic locking)
│       │   │   │   ├── dto/           # Zod validation schemas (Create, Update Status, Query, ID Param)
│       │   │   │   ├── entities/      # Domain entity model
│       │   │   │   ├── tasks.constants.ts
│       │   │   │   ├── tasks.repository.ts
│       │   │   │   ├── tasks.service.ts
│       │   │   │   ├── tasks.controller.ts
│       │   │   │   ├── tasks.module.ts
│       │   │   │   └── __tests__/     # Integration & concurrency tests
│       │   │   └── audit-logs/        # Audit log module (chronological timeline)
│       │   │       ├── dto/           # Response DTO
│       │   │       ├── entities/      # Audit log entity
│       │   │       ├── audit-logs.repository.ts
│       │   │       ├── audit-logs.service.ts
│       │   │       ├── audit-logs.controller.ts
│       │   │       └── audit-logs.module.ts
│       │   ├── app.module.ts          # Root module aggregator
│       │   ├── app.ts                 # Express app factory (dependency injection seam)
│       │   └── server.ts              # Server entry point
│       └── prisma/                    # Database schema, migrations, & seeders
├── PLAN.md
├── AGENTS.md
├── ROADMAP.md
├── CHANGELOG.md
├── docker-compose.yml
└── README.md
```

### Pola Arsitektur Backend (Feature-Based)
Agar kode tetap terstruktur dan terisolasi per domain, backend memisahkan tanggung jawab pada setiap modul:
1. **`*.module.ts`**: Merangkai dependensi via constructor (`Repository` $\rightarrow$ `Service` $\rightarrow$ `Controller`) dan mendaftarkan route ke Express Router.
2. **`dto/`**: Validasi request body menggunakan Zod dan DTO.
3. **`entities/`**: Representasi tipe data domain task dan audit log.
4. **`core/`**: Komponen bersama (`PrismaService`, error handler middleware, custom error classes).
5. **`app.module.ts`**: Aggregator utama yang mendaftarkan seluruh rute fitur ke prefix `/api`.
### Domain Rules & Alur Transisi Status (Kacamata Produk & Bisnis)
- **Status yang Valid**: `to_do`, `pending`, `in_progress`, `done`
- **Urutan Transisi (Strict)**:
  $$\text{to\_do} \longrightarrow \text{pending} \longrightarrow \text{in\_progress} \longrightarrow \text{done}$$
- **Initial Status**: Setiap task baru selalu dimulai dari `to_do`.
- **Idempotensi (User Safety)**: Jika pengguna tidak sengaja menekan tombol update dua kali atau koneksi internet terputus-putus, sistem menganggapnya aman (HTTP 200 no-op) dan **tidak mencatat audit log duplikat** yang mengotori timeline tim.
- **Backend Single Source of Truth (Anti-Manipulasi)**: Status lama selalu divalidasi langsung dari database saat transaksi berjalan, bukan dari kiriman form browser, sehingga riwayat perubahan tidak bisa dimanipulasi dari sisi pengguna.
- **Defensive UX (Frontend Guardrail)**: Dropdown target status di frontend menyaring status-status lampau agar pengguna tidak bisa memilih rollback ke status sebelumnya (*zero confusion*). Namun, validasi mutlak tetap ditegakkan di backend untuk menangkal request langsung dari API eksternal.
---

## 3. Desain API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | Retrieve active tasks (supports optional `?status=...` filter) |
| `POST` | `/api/tasks` | Create a new task (initial status: `to_do`) |
| `PUT` | `/api/tasks/:id/status` | Update task status with optimistic locking (`{ status, actor }`) |
| `DELETE` | `/api/tasks/:id` | Soft-delete a task |
| `GET` | `/api/tasks/:id/audit-logs` | Retrieve chronological audit logs for a task |

---

## 4. Asumsi & Trade-Off

### Asumsi
1. **Actor Model**: Karena autentikasi berada di luar cakupan assessment (*no overengineering*), aktor dipilih melalui dropdown dari predefined user list (`john.doe`, `jane.smith`, `bob.wilson`, `alice.walker`).
2. **Soft Delete**: Penghapusan task diimplementasikan menggunakan kolom `deletedAt`. Data fisik task tetap tersimpan sehingga relasi foreign key pada audit log tidak menjadi *orphaned* dan histori perubahan tetap lengkap.
3. **Relational Database**: PostgreSQL dipilih karena sistem audit log membutuhkan jaminan transaksi ACID saat mengupdate status task dan menyimpan log secara bersamaan.

### Trade-Off
1. **Direct Database Transaction vs Background Queue**:
   - *Pilihan*: Menggunakan transaksi database langsung (`prisma.$transaction`) di backend, bukan antrean worker eksternal.
   - *Alasan*: Menjaga kesederhanaan sistem (*no overengineering*) dan menjamin konsistensi data seketika (*strong consistency*) tanpa menambah kompleksitas infrastruktur.
2. **Synchronous Audit Logging vs Asynchronous Outbox**:
   - *Pilihan*: Menulis audit log secara sinkron di dalam satu transaksi database bersamaan dengan status task.
   - *Alasan*: Menjamin *zero inconsistency* (status task tidak akan pernah berubah tanpa tercatat di audit log). Konsekuensinya adalah sedikit penambahan waktu write di database.
3. **Feature-Based Architecture vs Flat Folder Structure**:
   - *Pilihan*: Memisahkan kode per fitur (`tasks/`, `audit-logs/`) dengan layer terisolasi (`dto`, `entities`, `repository`, `service`, `controller`), alih-alih menaruh seluruh controller dan route dalam satu folder global.
   - *Alasan*: Menjaga isolasi logika domain dan mempermudah pengujian unit dengan constructor dependency injection, dengan konsekuensi jumlah file lebih banyak di awal.
4. **Application-Level Immutability vs Database-Level Triggers (Anti-Overengineering)**:
   - *Pilihan*: Menjamin integritas immutability audit log di level aplikasi (ketiadaan endpoint mutasi, repository append-only, relasi `onDelete: Restrict`, dan soft-delete task) alih-alih memasang raw SQL triggers atau manajemen user privilege Postgres khusus.
   - *Alasan*: Mencegah *overengineering* pada skala MVP, menjaga skema Prisma tetap portabel, serta memastikan test suite dapat berjalan 100% database-agnostic dan cepat tanpa memerlukan hak akses superuser database.
---

## 5. Jika Ada Waktu Lebih, Apa yang Akan Diperbaiki?

Jika saya memiliki alokasi waktu tambahan di luar batas pengerjaan 3–5 jam, beberapa area yang akan saya tingkatkan meliputi:

1. **Automated End-to-End (E2E) Testing (Playwright)**: Menambahkan pengujian visual browser penuh dari pembuatan task, pemilihan actor di dropdown, transisi status sekuensial, hingga pembukaan modal riwayat log.
2. **Real-Time Updates (WebSocket / SSE)**: Mengintegrasikan live push updates agar perubahan status oleh rekan tim langsung terrefleksi di browser pengguna lain secara reaktif.
3. **Enterprise Database-Level Immutability (Bila Masuk Kebutuhan Regulasi Formal)**: Jika sistem berevolusi membutuhkan audit kepatuhan ketat (seperti SOC 2 atau HIPAA), proteksi tambahan berupa PostgreSQL trigger (`BEFORE UPDATE/DELETE ... DO NOTHING`) atau pemisahan role database dapat diterapkan untuk melindungi data dari manipulasi langsung via CLI/DBA.
4. **Penerapan Standar Waktu UTC & Konversi Timezone Klien (Multi-Timezone Support)**:
   - *Konteks & Masalah*: Saat ini timestamp tersimpan di database dan narasi audit backend diformat dalam standar ISO UTC, sementara rendering di browser menggunakan locale default perangkat. Jika aplikasi digunakan oleh tim yang tersebar di beberapa zona waktu (misal: tim Jakarta WIB, Bali WITA, atau remote global), interpretasi waktu perubahan status bisa membingungkan jika tidak ada label zona waktu yang eksplisit.
   - *Rencana Perbaikan*: Menjaga backend dan database strictly beroperasi dalam standar UTC (ISO-8601), lalu menambahkan konversi zona waktu dinamis di frontend menggunakan `Intl.DateTimeFormat` / `date-fns-tz`. Pengguna dapat melihat penanda zona waktu eksplisit (misal `14:30 WIB / 07:30 UTC`) serta memiliki kontrol *timezone selector* di antarmuka (toggle antara waktu lokal klien dan UTC) agar linimasa audit transparan dan relevan bagi seluruh anggota tim lintas wilayah.

---

## 6. Jawaban Evaluasi Teknis

### Q1: Bagaimana kamu memastikan audit log tidak ter-modifikasi?

**Dari Kacamata Produk**: Menjamin akuntabilitas dan integritas data tim—riwayat perubahan hanya bisa dibaca, tidak pernah bisa diedit atau dihapus oleh siapa pun (termasuk admin), bahkan saat task dihapus dari daftar aktif.

**Mekanisme Teknis**:
1. **API Layer**: Hanya mengekspos endpoint pembacaan (`GET /api/tasks/:id/audit-logs`). Tidak ada endpoint mutasi (`PUT`/`PATCH`/`DELETE`).
2. **Service & Repository**: `AuditLogsRepository` hanya menyediakan method `findByTaskId`. Tidak ada fungsi update maupun delete di level kode aplikasi.
3. **Single Source of Truth**: Nilai `fromStatus` selalu dibaca langsung dari database saat transaksi, bukan dari payload client, mencegah pemalsuan status riwayat.
4. **Atomic Transaction (`prisma.$transaction`)**: Update task dan insert audit log dieksekusi secara atomik (*all-or-nothing*). Jika penulisan log gagal, status task otomatis batal berubah (di-rollback).
5. **Soft Delete**: Penghapusan task menggunakan kolom `deletedAt` dengan foreign key `onDelete: Restrict`, sehingga riwayat log fisik di database tidak pernah terhapus.

---

### Q2: Bagian mana dari solusi ini yang paling berisiko jika digunakan oleh banyak user?

**Dari Kacamata Produk**: Risiko terbesar ada pada **kolaborasi bersamaan (bentrok data)**—ketika dua anggota tim membuka task yang sama dan mencoba mengubah status di detik yang sama, atau lonjakan klik serentak yang memperlambat respon server.

**Rincian Risiko & Mitigasi Teknis**:
1. **Bentrok Perubahan Bersamaan (Race Condition)**: Dua user mengubah status task yang sama di saat bersamaan.
   - *Mitigasi*: Menggunakan *Optimistic Concurrency Control* via kolom `version`. Sistem otomatis menolak perubahan kedua dengan status HTTP `409 Conflict` agar data lama tidak tertimpa tanpa disengaja.
2. **Antrean Server Melambat (Connection Pool Exhaustion)**: Transaksi sinkron (`SELECT` + `UPDATE` + `INSERT`) menahan koneksi database lebih lama saat terjadi lonjakan klik serentak (*burst writes*), berisiko memicu loading lama hingga timeout (HTTP 504).
3. **Riwayat Terlalu Panjang Tanpa Halaman (No Pagination)**: Mengambil seluruh riwayat audit sekaligus pada task yang sering direvisi dapat memperberat memori server dan memperlambat render UI di browser.
4. **Tampilan Data Usang di Layar Pengguna (Stale Data)**: Tanpa pembaruan live (WebSocket/SSE), layar pengguna masih menampilkan status lama jika sudah diubah oleh rekan tim lain, sehingga aksi pengguna akan ditolak sistem (HTTP 400).

---

### Q3: Jika task ini berkembang menjadi sistem besar, bagian mana yang akan kamu refactor terlebih dahulu dan kenapa?

**Dari Kacamata Produk**: Fokus perbaikan adalah **menjaga performa aplikasi tetap cepat dan responsif** bagi pengguna seiring bertambahnya puluhan ribu data task dan riwayat perubahan tim, tanpa mengorbankan integritas data.

**Rencana Teknis**:
1. **Asynchronous Audit Logging via Background Queue / Worker**:
   - *Solusi*: Request pengguna hanya mengupdate status task seketika, sementara penyimpanan riwayat audit log diproses di latar belakang (*background worker*).
   - *Dampak Produk*: Tombol aksi di layar pengguna merespons jauh lebih cepat (sub-milidetik) dan beban database berkurang drastis saat jam sibuk.
2. **PostgreSQL Table Partitioning untuk Audit Logs**:
   - *Solusi*: Membagi tabel riwayat log per rentang waktu (misal per bulan) di level database dengan cursor-based pagination.
   - *Dampak Produk*: Menjaga pencarian dan pembukaan modal riwayat audit tetap instan meskipun data tim telah terakumulasi selama berbulan-bulan.
3. **Pembaruan Layar Real-Time (SSE / WebSocket)**:
   - *Solusi*: Mengirim pembaruan status task secara langsung ke browser pengguna lain.
   - *Dampak Produk*: Menghilangkan data usang di layar; ketika rekan tim mengubah status, layar seluruh tim terupdate seketika tanpa perlu refresh manual.

---

### Q4: Jika kamu menggunakan AI, jelaskan bagian mana yang dibantu AI dan bagaimana kamu memvalidasinya?

1. **Pemanfaatan AI (Tool: `omp.sh` dengan model `gemini-3.8-flash`)**:
   - **Brainstorming Awal & Penyusunan `PLAN.md`**: Sebelum masuk ke tahap implementasi, saya menganalisis problem statement dan requirements sistem task & audit log, lalu melakukan brainstorming untuk merancang arsitektur awal di `PLAN.md`. Karena sebelumnya saya sedang mengeksplorasi arsitektur NestJS (termasuk konsep microservice) dan menyadari bahwa Express.js bersifat *unopinionated*, saya berinisiatif menambahkan konteks agar struktur kode Express ditata rapi menyerupai pola modular NestJS (`core/`, `modules/<feature>/`, `dto/`, `entities/`, `repository`, `service`, `controller`). Keputusan ini diambil untuk menghemat waktu dan menghasilkan struktur file yang bersih, terisolasi, dan mudah dipelihara.
   - **Penyusunan Guardrail Teknis (`AGENTS.md` & `ROADMAP.md`)**: Berdasarkan blueprint `PLAN.md` tersebut, saya meminta AI untuk mematangkan aturan main ke dalam `AGENTS.md` (mengunci batasan arsitektur, domain rules, dan non-functional requirements) serta `ROADMAP.md` (pelacakan milestone terukur). Tujuannya agar aturan sistem sudah 100% jelas dan terikat sebelum kode mulai ditulis.
   - **Implementasi End-to-End & `CHANGELOG.md`**: Setelah `PLAN.md`, `AGENTS.md`, dan `ROADMAP.md` matang, saya mengarahkan AI untuk mengeksekusi implementasi secara end-to-end: skema & migrasi Prisma, transaksi atomik transisi status dan audit log, UI React dengan Tailwind CSS, konfigurasi multi-container Docker Compose, hingga mencatat setiap riwayat kemajuan secara disiplin di `CHANGELOG.md`.
   - **Final Documentation**: Setelah seluruh implementasi selesai dan lolos pengujian, AI digunakan untuk men-generate dan merapikan dokumen akhir `README.md`.
2. **Metode Validasi yang Saya Lakukan**:
   - **Automated Testing (Unit & Integration Tests)**: Membuat dan menjalankan automated test suite (`npm run test:backend`: 10 passing tests) untuk memvalidasi secara objektif bahwa kode yang dihasilkan AI memenuhi aturan domain: alur transisi sekuensial, penolakan transisi ilegal (HTTP 400), idempotensi update (0 log baru), rollback transaksi database saat error, optimistic locking saat concurrent update (HTTP 409), serta server-side filtering via query parameter.
   - **Manual Testing (Smoke Testing)**: Menjalankan aplikasi secara langsung di browser dan via API (baik di environment lokal maupun via multi-container Docker Compose) untuk memverifikasi interaksi end-to-end: pembuatan task, transisi status bertahap via dropdown aktor, visualisasi modal audit log secara kronologis, pembuktian guardrail UX pada dropdown target status, serta membuktikan bahwa soft delete task tetap mempertahankan seluruh data riwayat audit log.
