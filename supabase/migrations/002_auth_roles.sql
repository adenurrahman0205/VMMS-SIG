-- VMMS 002 — profiles, roles, permissions (Supabase Auth: profiles.id = auth.users.id)

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  constraint roles_name_chk check (name in (
    'SUPER_ADMIN', 'FLEET_ADMIN', 'SUPERVISOR', 'MANAGEMENT', 'DRIVER'
  ))
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  department_code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  employee_number text unique,
  full_name text not null,
  email text not null unique,
  phone text,
  department_id uuid references public.departments (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  unique (role_id, permission_id)
);

create trigger trg_departments_updated_at before update on public.departments
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
