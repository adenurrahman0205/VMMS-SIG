-- VMMS 003 — drivers, workshops, spareparts, vehicles, assignments, odometer, status logs

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique,
  name text not null,
  phone text,
  department_id uuid references public.departments (id),
  license_type text,
  license_number text,
  license_expiry date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  workshop_code text not null unique,
  name text not null,
  address text,
  phone text,
  email text,
  contact_person text,
  tax_number text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spareparts (
  id uuid primary key default gen_random_uuid(),
  part_code text not null unique,
  part_name text not null,
  category text,
  brand text,
  unit text not null default 'PCS',
  default_price numeric(14,2) not null default 0 check (default_price >= 0),
  stock numeric(14,3) not null default 0 check (stock >= 0),
  minimum_stock numeric(14,3) not null default 0 check (minimum_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_code text not null unique,
  plate_number text not null unique,
  brand text not null,
  model text not null,
  vehicle_type text,
  year int check (year is null or (year between 1980 and 2100)),
  color text,
  engine_number text,
  chassis_number text,
  purchase_date date,
  purchase_price numeric(14,2) check (purchase_price is null or purchase_price >= 0),
  initial_odometer int not null default 0 check (initial_odometer >= 0),
  current_odometer int not null default 0 check (current_odometer >= 0),
  status text not null default 'READY',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_status_chk check (status in (
    'READY', 'OPERATIONAL', 'WARNING', 'MAINTENANCE', 'ACCIDENT', 'INACTIVE', 'SOLD'
  ))
);

create table if not exists public.vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  department_id uuid not null references public.departments (id) on delete restrict,
  driver_id uuid references public.drivers (id) on delete restrict,
  start_date date not null,
  end_date date,
  assignment_type text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint vehicle_assignments_dates_chk check (end_date is null or end_date >= start_date)
);

-- Prevent overlapping active/open assignments for the same vehicle
create unique index if not exists uq_vehicle_assignment_open
  on public.vehicle_assignments (vehicle_id)
  where end_date is null;

create table if not exists public.vehicle_status_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  status text not null,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  reason text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint vehicle_status_logs_status_chk check (status in (
    'READY', 'OPERATIONAL', 'WARNING', 'MAINTENANCE', 'ACCIDENT', 'INACTIVE', 'SOLD'
  ))
);

create table if not exists public.odometer_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  record_date date not null default current_date,
  odometer int not null check (odometer >= 0),
  source text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create trigger trg_drivers_updated_at before update on public.drivers
  for each row execute function public.set_updated_at();
create trigger trg_workshops_updated_at before update on public.workshops
  for each row execute function public.set_updated_at();
create trigger trg_spareparts_updated_at before update on public.spareparts
  for each row execute function public.set_updated_at();
create trigger trg_vehicles_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();

create index if not exists idx_vehicles_plate on public.vehicles (plate_number);
create index if not exists idx_vehicles_code on public.vehicles (vehicle_code);
create index if not exists idx_vehicles_status on public.vehicles (status);
create index if not exists idx_va_vehicle on public.vehicle_assignments (vehicle_id);
create index if not exists idx_va_dept on public.vehicle_assignments (department_id);
create index if not exists idx_va_driver on public.vehicle_assignments (driver_id);
create index if not exists idx_odometer_vehicle on public.odometer_logs (vehicle_id, record_date);
create index if not exists idx_status_logs_vehicle on public.vehicle_status_logs (vehicle_id);
