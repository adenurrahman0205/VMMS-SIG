-- VMMS 009 — hapus role FLEET_ADMIN; tulis master hanya SUPER_ADMIN

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('SUPER_ADMIN')
      or public.has_role('SUPERVISOR')
      or public.has_role('MANAGEMENT');
$$;

delete from public.user_roles
where role_id in (select id from public.roles where name = 'FLEET_ADMIN');

delete from public.role_permissions
where role_id in (select id from public.roles where name = 'FLEET_ADMIN');

delete from public.roles where name = 'FLEET_ADMIN';

alter table public.roles drop constraint if exists roles_name_chk;
alter table public.roles add constraint roles_name_chk check (name in (
  'SUPER_ADMIN', 'SUPERVISOR', 'MANAGEMENT', 'DRIVER'
));

update public.app_kv
set value = coalesce((
  select jsonb_agg(
    case
      when elem->>'role' = 'FLEET_ADMIN' then jsonb_set(elem, '{role}', '"USER"')
      else elem
    end
  )
  from jsonb_array_elements(coalesce(value, '[]'::jsonb)) elem
), '[]'::jsonb)
where key = 'users';
