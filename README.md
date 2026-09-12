# VMMS-SIG

**Vehicle Maintenance Management System — SIG**

Stack: Next.js (TypeScript, Tailwind) · PostgreSQL / Supabase · Vercel

## Lokal

```bash
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Database

Jalankan migrasi berurutan di Supabase SQL Editor:

`supabase/migrations/001_*.sql` … `007_rls.sql`, lalu `supabase/seed.sql`.

## Integrasi

| Layanan | Yang dibutuhkan |
|---|---|
| GitHub | Repo `vmms-sig`, push branch `main` |
| Vercel | Import repo, env vars sama seperti `.env.example` |
| Supabase | Project baru, apply migrasi, bucket Storage, env ke Vercel |

Service role key **tidak** boleh di-prefix `NEXT_PUBLIC_`.
