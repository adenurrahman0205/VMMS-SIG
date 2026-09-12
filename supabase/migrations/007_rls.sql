-- VMMS 007 — RLS. Security at DB, not UI. Service role bypasses RLS (server only).

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('SUPER_ADMIN')
      or public.has_role('FLEET_ADMIN')
      or public.has_role('SUPERVISOR')
      or public.has_role('MANAGEMENT');
$$;

-- Enable RLS
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.drivers enable row level security;
alter table public.workshops enable row level security;
alter table public.spareparts enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_assignments enable row level security;
alter table public.vehicle_status_logs enable row level security;
alter table public.odometer_logs enable row level security;
alter table public.maintenance enable row level security;
alter table public.maintenance_items enable row level security;
alter table public.maintenance_parts enable row level security;
alter table public.expenses enable row level security;
alter table public.maintenance_schedules enable row level security;
alter table public.vehicle_documents enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.export_logs enable row level security;
alter table public.backup_logs enable row level security;

-- Profiles: self read; staff read all; super admin write
create policy profiles_select_self on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.has_role('SUPER_ADMIN'))
  with check (id = auth.uid() or public.has_role('SUPER_ADMIN'));

-- Catalog / master: staff read; fleet+super write
create policy staff_read_roles on public.roles for select using (public.is_staff());
create policy staff_read_perms on public.permissions for select using (public.is_staff());
create policy staff_read_ur on public.user_roles for select using (public.is_staff() or user_id = auth.uid());
create policy staff_read_rp on public.role_permissions for select using (public.is_staff());

create policy staff_read_dept on public.departments for select using (public.is_staff() or public.has_role('DRIVER'));
create policy fleet_write_dept on public.departments for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_drv on public.drivers for select using (public.is_staff());
create policy fleet_write_drv on public.drivers for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_ws on public.workshops for select using (public.is_staff());
create policy fleet_write_ws on public.workshops for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_sp on public.spareparts for select using (public.is_staff());
create policy fleet_write_sp on public.spareparts for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

-- Vehicles
create policy staff_read_veh on public.vehicles for select using (public.is_staff());
create policy driver_read_assigned_veh on public.vehicles for select
  using (
    public.has_role('DRIVER') and exists (
      select 1 from public.vehicle_assignments va
      join public.drivers d on d.id = va.driver_id
      where va.vehicle_id = vehicles.id
        and va.end_date is null
        and d.employee_number = (select p.employee_number from public.profiles p where p.id = auth.uid())
    )
  );
create policy fleet_write_veh on public.vehicles for insert
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));
create policy fleet_upd_veh on public.vehicles for update
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));
-- no delete policy → no hard delete via anon/authenticated

create policy staff_read_va on public.vehicle_assignments for select using (public.is_staff());
create policy fleet_write_va on public.vehicle_assignments for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_vsl on public.vehicle_status_logs for select using (public.is_staff());
create policy fleet_write_vsl on public.vehicle_status_logs for insert
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_odo on public.odometer_logs for select using (public.is_staff());
create policy fleet_ins_odo on public.odometer_logs for insert
  with check (
    public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN') or public.has_role('DRIVER')
  );

create policy staff_read_mnt on public.maintenance for select using (public.is_staff());
create policy fleet_write_mnt on public.maintenance for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));
create policy supervisor_upd_mnt on public.maintenance for update
  using (public.has_role('SUPERVISOR'))
  with check (public.has_role('SUPERVISOR'));

create policy staff_read_mi on public.maintenance_items for select using (public.is_staff());
create policy fleet_write_mi on public.maintenance_items for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_mp on public.maintenance_parts for select using (public.is_staff());
create policy fleet_write_mp on public.maintenance_parts for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_exp on public.expenses for select using (public.is_staff());
create policy fleet_write_exp on public.expenses for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_sch on public.maintenance_schedules for select using (public.is_staff());
create policy fleet_write_sch on public.maintenance_schedules for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_doc on public.vehicle_documents for select using (public.is_staff());
create policy fleet_write_doc on public.vehicle_documents for all
  using (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'))
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_att on public.attachments for select using (public.is_staff());
create policy fleet_write_att on public.attachments for insert
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy notif_own on public.notifications for select using (user_id = auth.uid());
create policy notif_upd_own on public.notifications for update using (user_id = auth.uid());

-- Audit: staff read; no update/delete for non-super
create policy staff_read_audit on public.audit_logs for select using (public.is_staff());
create policy super_no_delete_audit on public.audit_logs for delete using (false);

create policy staff_read_export on public.export_logs for select using (public.is_staff());
create policy fleet_ins_export on public.export_logs for insert
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

create policy staff_read_backup on public.backup_logs for select using (public.is_staff());
create policy super_write_backup on public.backup_logs for insert
  with check (public.has_role('SUPER_ADMIN') or public.has_role('FLEET_ADMIN'));

revoke delete on public.audit_logs from anon, authenticated;
