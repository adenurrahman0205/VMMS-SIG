-- VMMS 005 — documents, attachments metadata, notifications

create table if not exists public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  document_type text not null,
  document_number text,
  issue_date date,
  expiry_date date,
  file_path text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_documents_type_chk check (document_type in (
    'STNK', 'BPKB', 'KIR', 'ASURANSI', 'PAJAK', 'OTHER'
  )),
  constraint vehicle_documents_dates_chk check (
    expiry_date is null or issue_date is null or expiry_date >= issue_date
  )
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete restrict,
  maintenance_id uuid references public.maintenance (id) on delete restrict,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  reference_type text,
  reference_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create trigger trg_vehicle_documents_updated_at before update on public.vehicle_documents
  for each row execute function public.set_updated_at();

create index if not exists idx_docs_vehicle on public.vehicle_documents (vehicle_id);
create index if not exists idx_docs_expiry on public.vehicle_documents (expiry_date);
create index if not exists idx_att_vehicle on public.attachments (vehicle_id);
create index if not exists idx_att_mnt on public.attachments (maintenance_id);
create index if not exists idx_notif_user on public.notifications (user_id, is_read);
