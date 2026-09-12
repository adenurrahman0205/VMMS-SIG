-- Portable PostgreSQL schema (Supabase-compatible, no vendor lock-in)
-- Run in Supabase SQL editor or any Postgres 15+

create extension if not exists "pgcrypto";

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text unique not null,
  brand text not null,
  model text not null,
  year int,
  color text,
  engine_no text,
  chassis_no text,
  km int not null default 0,
  department_id uuid references departments(id),
  driver_id uuid references drivers(id),
  location text,
  status text not null default 'ready',
  health_score int default 80,
  purchased_at date,
  purchase_price numeric(14,2),
  created_at timestamptz default now()
);

create table if not exists vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  doc_type text not null,
  expires_at date,
  storage_path text,
  status text default 'aktif',
  created_at timestamptz default now()
);

create table if not exists maintenance (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  vehicle_id uuid not null references vehicles(id),
  workshop_id uuid references workshops(id),
  serviced_at date not null,
  km int,
  type text not null,
  complaint text,
  action text,
  labor_cost numeric(14,2) default 0,
  total_cost numeric(14,2) default 0,
  status text default 'selesai',
  invoice_path text,
  created_at timestamptz default now()
);

create table if not exists maintenance_items (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references maintenance(id) on delete cascade,
  name text not null,
  qty int not null default 1,
  unit_price numeric(14,2) not null default 0
);

create table if not exists odometer_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  km int not null,
  logged_at date not null default current_date
);

create table if not exists backup_logs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz default now(),
  status text not null,
  db_bytes bigint,
  note text
);

-- Storage buckets (Supabase): photos, invoices, documents, attachments
-- RLS: enable per table; policies by role (super_admin, fleet_admin, supervisor, management, driver)

alter table vehicles enable row level security;
alter table maintenance enable row level security;
alter table vehicle_documents enable row level security;
