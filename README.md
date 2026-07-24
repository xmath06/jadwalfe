# Frontend — Sistem Penjadwalan SMA

Antarmuka web untuk sistem penjadwalan pelajaran SMA multi-tenant. Dibangun dengan **SvelteKit 5** (Runes), **Svelte 5**, **Tailwind CSS v4**, dan **TypeScript**.

## Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| [SvelteKit](https://kit.svelte.dev) v2 | Framework full-stack |
| [Svelte 5](https://svelte.dev) | UI (Runes: `$state`, `$effect`, `$derived`) |
| [Tailwind CSS](https://tailwindcss.com) v4 | Styling |
| [Vite](https://vitejs.dev) v8 | Build tool |
| [SheetJS xlsx](https://sheetjs.com) | Export/import Excel |
| Node.js ≥ 20 (via nvm v24.15.0) | Runtime |

## Struktur Proyek

```
src/
├── app.html                      # HTML shell
├── app.css                       # Global Tailwind CSS
├── routes/
│   ├── +layout.svelte            # Layout root (sidebar, auth guard)
│   ├── +page.svelte              # Redirect ke /dashboard atau /login
│   ├── login/
│   │   └── +page.svelte          # Halaman login
│   ├── dashboard/
│   │   ├── +layout.svelte
│   │   └── +page.svelte          # Dashboard utama
│   ├── jadwal/
│   │   ├── +page.svelte          # **Grid penjadwalan drag-and-drop**
│   │   ├── generate/
│   │   │   └── +page.svelte      # Generate otomatis (GA)
│   │   └── cetak/
│   │       └── +page.svelte      # Tampilan cetak A4 landscape
│   ├── guru/+page.svelte         # CRUD guru
│   ├── mapel/+page.svelte        # CRUD mata pelajaran
│   ├── kelas/+page.svelte        # CRUD kelas
│   ├── ruangan/+page.svelte      # CRUD ruangan
│   ├── sesi/+page.svelte         # CRUD konfigurasi sesi
│   ├── tahun-ajaran/+page.svelte # CRUD tahun ajaran
│   ├── sekolah/+page.svelte      # Edit profil sekolah
│   ├── pengguna/+page.svelte     # CRUD users
│   └── kurikulum/+page.svelte    # Alokasi kurikulum & beban guru
├── lib/
│   ├── api.js                    # HTTP client (fetch wrapper)
│   ├── index.ts                  # Re-export
│   ├── components/
│   │   ├── forms/
│   │   │   ├── GuruForm.svelte
│   │   │   ├── KelasForm.svelte
│   │   │   ├── MapelForm.svelte
│   │   │   └── RuanganForm.svelte
│   │   └── ui/
│   │       ├── ToastContainer.svelte  # Notifikasi global
│   │       └── ...
│   └── stores/
│       ├── auth.svelte.js        # State auth (token, user, sekolah)
│       └── toast.svelte.js       # Manajemen notifikasi
```

## Halaman & Fungsionalitas

| Route | Fitur |
|-------|-------|
| `/` | Redirect berdasarkan status login |
| `/login` | Form login dengan JWT |
| `/dashboard` | Informasi user & sekolah |
| `/jadwal` | **Drag-and-drop scheduling board** — grid kelas/guru, kantong pelajaran (deck) dengan progress JP, batch insert untuk `tidak_boleh_dipisah`, baris istirahat merah, export Excel multi-sheet |
| `/jadwal/generate` | Jalankan Genetic Algorithm otomatis dengan real-time progress |
| `/jadwal/cetak` | Tampilan jadwal siap cetak (A4 landscape, filter kelas/guru) |
| `/guru` | CRUD guru + import/export Excel |
| `/mapel` | CRUD mata pelajaran + filter wajib pagi |
| `/kelas` | CRUD kelas (referensi tingkat & jurusan) |
| `/ruangan` | CRUD ruangan (filter jenis: Teori/Praktek/Lapangan) |
| `/sesi` | CRUD sesi (hari, jam ke, waktu, istirahat) |
| `/tahun-ajaran` | CRUD tahun ajaran + toggle aktif |
| `/sekolah` | Edit profil sekolah |
| `/pengguna` | CRUD users (password tersembunyi) |
| `/kurikulum` | Alokasi mapel & guru ke kelas, beban mengajar guru |

## Cara Menjalankan

### Prasyarat
- Node.js ≥ 20 (wajib — gunakan nvm)
- Backend API berjalan di `http://localhost:3000`

### Setup & Run

```bash
# Pindah ke direktori frontend
cd frontend

# Gunakan Node versi yang benar
export PATH="/Users/cita/.nvm/versions/node/v24.15.0/bin:$PATH"

# Install dependensi
bun install

# Jalankan dev server
bun run dev
```

Frontend berjalan di `http://localhost:5173`.

> **Catatan:** Sistem default `node` adalah v16 (terlalu tua). Pastikan menggunakan Node ≥ 20 via nvm.

### Scripts

| Script | Perintah |
|--------|----------|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build produksi |
| `npm run preview` | Preview build |
| `npm run check` | `svelte-check` (0 errors, 0 warnings) |

## Koneksi ke Backend

Semua request API melalui `src/lib/api.js` yang:

- Menuju `http://localhost:3000/api`
- Menyertakan `Authorization: Bearer <token>` otomatis
- Menyisipkan `id_sekolah` dari konteks auth
- Mengembalikan error terdeskripsi untuk response non-OK

## Konvensi Kode

- **Svelte 5 Runes**: `$state()`, `$effect()`, `$derived()`, `$props()`
- **Form re-sync**: `let form = $state({...data})` + `$effect(() => form = {...data})`
- **A11y**: Gunakan `svelte-ignore` untuk warning aksesibilitas yang tidak relevan
- **Zero warnings**: Setiap commit/check harus 0 error 0 warning dari `svelte-check`
- **Form modal**: `role="presentation"` wrapper + `role="dialog"` inner

## Backend

Proyek backend (Bun + ElysiaJS + PostgreSQL) ada di folder [`/`](../).
