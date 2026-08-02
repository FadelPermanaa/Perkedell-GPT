# My Chatbot — Next.js + DeepSeek (siap deploy ke Vercel)

Chatbot mirip ChatGPT: sidebar riwayat percakapan, banyak chat, dibuat pakai
React (Next.js) supaya bisa langsung di-deploy ke Vercel lewat GitHub.

## Struktur project

```
chatgpt-clone/
├── package.json
├── next.config.js
├── .env.example
├── .gitignore
└── app/
    ├── layout.js
    ├── page.js           <- UI utama (sidebar + chat)
    ├── globals.css        <- styling mirip ChatGPT
    └── api/
        └── chat/
            └── route.js    <- serverless function yang panggil DeepSeek
```

Tidak ada file `.html` terpisah — semua UI dibuat pakai komponen React
(`page.js`). Next.js yang mengubahnya jadi HTML otomatis saat build.

## Bagian penting: kenapa ini beda dari versi sebelumnya

- **Tidak butuh server Python terus-menerus jalan.** `app/api/chat/route.js`
  otomatis jadi *serverless function* yang di-hosting Vercel — jalan hanya
  saat ada request, kamu tidak perlu urus server sendiri.
- **Riwayat percakapan disimpan di `localStorage` browser**, bukan database
  server. Ini pilihan paling simpel untuk deploy ke Vercel tanpa perlu setup
  database tambahan — cocok untuk pemakaian pribadi. (Konsekuensinya: riwayat
  cuma ada di browser/device itu, tidak otomatis sync ke device lain.)

## Langkah 1: Coba jalankan dulu di laptop

1. Pastikan **Node.js** sudah terinstall (cek: `node --version`, minimal versi 18).
   Kalau belum ada, download di https://nodejs.org

2. Buka folder project ini di terminal, install dependency:
   ```bash
   npm install
   ```

3. Copy `.env.example` jadi `.env.local`, lalu isi API key kamu:
   ```bash
   cp .env.example .env.local
   ```
   Buka `.env.local`, ganti `isi-api-key-kamu-disini` dengan API key asli dari
   https://platform.deepseek.com

4. Jalankan:
   ```bash
   npm run dev
   ```

5. Buka http://localhost:3000

## Langkah 2: Upload ke GitHub

1. Buat repository baru di GitHub (kosong, tanpa README)
2. Di folder project, jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Ganti `USERNAME/NAMA-REPO` dengan punya kamu.

   > File `.env.local` **tidak akan ikut ter-upload** karena sudah ada di
   > `.gitignore` — API key kamu aman, tidak akan bocor ke publik.

## Langkah 3: Deploy ke Vercel

1. Buka https://vercel.com, login pakai akun GitHub kamu
2. Klik **"Add New" → "Project"**
3. Pilih repository yang baru kamu push tadi → klik **Import**
4. Vercel akan otomatis mendeteksi ini project Next.js — biarkan setting default
5. **Penting:** sebelum klik Deploy, buka bagian **Environment Variables**,
   tambahkan:
   - Name: `DEEPSEEK_API_KEY`
   - Value: (API key DeepSeek kamu)
6. Klik **Deploy**

Setelah selesai (biasanya 1-2 menit), Vercel kasih kamu URL publik seperti
`https://nama-project-kamu.vercel.app` — chatbot kamu sudah online.

## Update setelah deploy

Kalau kamu edit kode lagi, tinggal:
```bash
git add .
git commit -m "update"
git push
```
Vercel otomatis re-deploy tiap ada push baru ke branch `main`.

## Pengembangan lanjutan

- **Riwayat tersimpan di server (bukan cuma browser)** — perlu tambah
  database seperti Vercel Postgres atau Vercel KV (keduanya gampang
  diintegrasikan langsung dari dashboard Vercel)
- **Streaming response** (jawaban muncul kata-per-kata) — ubah
  `route.js` untuk pakai streaming response dari OpenAI SDK
- **Markdown rendering** untuk jawaban AI — pakai library `react-markdown`
- **Login/akun** — untuk multi-user beneran, tambah NextAuth.js + database

## Kalau ada error saat deploy

- Error `DEEPSEEK_API_KEY is not defined` → cek lagi Environment Variables
  di Vercel dashboard (Project Settings → Environment Variables), pastikan
  sudah di-set lalu **redeploy**
- Build gagal → cek log build di Vercel, biasanya karena typo di kode atau
  dependency belum lengkap di `package.json`
