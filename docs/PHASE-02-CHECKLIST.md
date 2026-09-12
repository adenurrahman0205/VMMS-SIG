# Phase 2 checkpoint — Database design

## File dibuat

- `docs/ERD.md`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_auth_roles.sql`
- `supabase/migrations/003_vehicle_module.sql`
- `supabase/migrations/004_maintenance_module.sql`
- `supabase/migrations/005_documents.sql`
- `supabase/migrations/006_audit_log.sql`
- `supabase/migrations/007_rls.sql`
- `supabase/seed.sql`
- `.env.example`

## Cara apply (Supabase)

1. Buat project Supabase.
2. SQL Editor → jalankan 001 … 007 berurutan.
3. Jalankan `seed.sql`.
4. Storage: buat bucket `vehicle`, `maintenance`, `invoice`, `documents`, `reports` (private).
5. Isi `.env.local` dari `.env.example` (anon key saja di client).

## Testing schema (tanpa UI)

Di SQL Editor:

```sql
-- unique plate
-- assignment overlap: insert dua baris end_date null untuk vehicle yang sama → harus gagal (unique index).
select indexname from pg_indexes where schemaname = 'public';
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

## Belum (Phase 3+)

Auth login, mapping user→profiles, tes RLS per role, master UI.

## Error / catatan

- `profiles.id` FK ke `auth.users` — seed tidak membuat user.
- Tidak ada hard-delete policy untuk vehicles/maintenance/audit.
- `has_role()` SECURITY DEFINER — jangan grant ke anon secara berlebihan; hanya dipakai policy.
