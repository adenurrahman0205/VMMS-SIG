-- VMMS 004 — maintenance, items, parts, expenses, schedules

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  maintenance_number text not null unique,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  maintenance_date date not null,
  odometer int check (odometer is null or odometer >= 0),
  maintenance_type text not null,
  complaint text,
  diagnosis text,
  action_taken text,
  workshop_id uuid references public.workshops (id),
  mechanic_name text,
  invoice_number text,
  labor_cost numeric(14,2) not null default 0 check (labor_cost >= 0),
  parts_cost numeric(14,2) not null default 0 check (parts_cost >= 0),
  other_cost numeric(14,2) not null default 0 check (other_cost >= 0),
  total_cost numeric(14,2) not null default 0 check (total_cost >= 0),
  status text not null default 'DRAFT',
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_status_chk check (status in (
    'DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  )),
  constraint maintenance_type_chk check (maintenance_type in (
    'SERVICE_BERKALA', 'GANTI_OLI', 'REM', 'BAN', 'AC', 'MESIN',
    'TRANSMISI', 'ELECTRICAL', 'BODY', 'ACCIDENT', 'OTHER'
  ))
);

create table if not exists public.maintenance_items (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references public.maintenance (id) on delete cascade,
  item_name text not null,
  description text,
  quantity numeric(14,3) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  total_price numeric(14,2) not null default 0 check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_parts (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references public.maintenance (id) on delete cascade,
  sparepart_id uuid not null references public.spareparts (id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  total_price numeric(14,2) not null default 0 check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references public.maintenance (id) on delete cascade,
  expense_type text not null,
  description text,
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  receipt_number text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint expenses_type_chk check (expense_type in ('LABOR', 'SPAREPART', 'SERVICE', 'OTHER'))
);

create table if not exists public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  maintenance_type text not null,
  interval_km int check (interval_km is null or interval_km > 0),
  interval_days int check (interval_days is null or interval_days > 0),
  last_maintenance_date date,
  last_maintenance_odometer int,
  next_due_date date,
  next_due_odometer int,
  status text not null default 'NORMAL',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_status_chk check (status in (
    'NORMAL', 'DUE_SOON', 'DUE', 'OVERDUE', 'COMPLETED'
  ))
);

create trigger trg_maintenance_updated_at before update on public.maintenance
  for each row execute function public.set_updated_at();
create trigger trg_schedules_updated_at before update on public.maintenance_schedules
  for each row execute function public.set_updated_at();

create index if not exists idx_mnt_vehicle on public.maintenance (vehicle_id);
create index if not exists idx_mnt_date on public.maintenance (maintenance_date);
create index if not exists idx_mnt_workshop on public.maintenance (workshop_id);
create index if not exists idx_mnt_status on public.maintenance (status);
create index if not exists idx_mnt_number on public.maintenance (maintenance_number);
create index if not exists idx_sched_vehicle on public.maintenance_schedules (vehicle_id);
create index if not exists idx_sched_status on public.maintenance_schedules (status);
