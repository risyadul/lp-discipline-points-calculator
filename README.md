# LP Discipline Points Calculator

Web statis berbasis Next.js untuk menghitung batas maksimal hari telat bulanan dengan target kedisiplinan minimum `85%`.

Project ini dibuat untuk kebutuhan internal Lion Parcel dengan fokus pada perhitungan sederhana per bulan.

## Fungsi Utama

- Menghitung total hari dalam bulan terpilih
- Menghitung total Sabtu dan Minggu secara otomatis
- Menampilkan daftar libur nasional pada bulan tersebut
- Mengabaikan libur nasional yang jatuh pada Sabtu atau Minggu
- Menghitung `total shift efektif`
- Menghitung `target minimum 85%`
- Menampilkan `total hari bisa telat`

## Rumus

Perhitungan yang digunakan:

`Total Shift Efektif = Total Hari Bulan - Sabtu/Minggu - Libur Nasional Hari Kerja`

`Target Minimum 85% = ceil(Total Shift Efektif x 85%)`

`Total Hari Bisa Telat = Total Shift Efektif - Target Minimum 85%`

Catatan:

- Hanya `libur nasional` yang dihitung
- `Cuti bersama` tidak dihitung
- Libur nasional yang jatuh di `Sabtu` atau `Minggu` tidak dikurangi dua kali

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components

## Menjalankan Project

Install dependency:

```bash
pnpm install
```

Jalankan development server:

```bash
pnpm dev
```

Build static export:

```bash
pnpm build
```

Hasil static export akan tersedia di folder `out/`.

## Struktur Project

```text
app/
  globals.css
  icon.svg
  layout.tsx
  page.tsx
components/
  discipline-calculator.tsx
  ui/
lib/
  utils.ts
```

## Icon

Project ini menggunakan ikon Lion Parcel sebagai favicon web melalui file:

`app/icon.svg`

## Status

Build dan lint project sudah tervalidasi berhasil.
