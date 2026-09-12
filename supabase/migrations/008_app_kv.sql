-- Shared app state so desktop and mobile see the same fleet / bookings / users.

create table if not exists public.app_kv (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_app_kv()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_kv_touch on public.app_kv;
create trigger trg_app_kv_touch before update on public.app_kv
  for each row execute function public.touch_app_kv();

alter table public.app_kv enable row level security;

drop policy if exists app_kv_select on public.app_kv;
drop policy if exists app_kv_write on public.app_kv;

create policy app_kv_select on public.app_kv for select
  using (auth.uid() is not null);

create policy app_kv_insert on public.app_kv for insert
  with check (auth.uid() is not null);

create policy app_kv_update on public.app_kv for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant select, insert, update on public.app_kv to authenticated;
