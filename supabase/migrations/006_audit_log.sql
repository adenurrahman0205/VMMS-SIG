-- VMMS 006 — audit, export, backup logs (no hard delete for audit)

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  export_type text not null,
  table_name text,
  filter_data jsonb,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.backup_logs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  status text not null,
  db_bytes bigint,
  storage_bytes bigint,
  note text,
  created_by uuid references public.profiles (id),
  constraint backup_logs_status_chk check (status in ('SUCCESS', 'FAILED', 'RUNNING'))
);

create index if not exists idx_audit_table on public.audit_logs (table_name, created_at desc);
create index if not exists idx_audit_user on public.audit_logs (user_id);
create index if not exists idx_export_user on public.export_logs (user_id);
