-- VMMS seed — catalog only. Bukan data production. Jangan insert profiles (butuh auth.users).

insert into public.roles (name, description) values
  ('SUPER_ADMIN', 'Full access'),
  ('FLEET_ADMIN', 'Operasional armada'),
  ('SUPERVISOR', 'View + approval'),
  ('MANAGEMENT', 'Dashboard & laporan'),
  ('DRIVER', 'Unit yang ditugaskan')
on conflict (name) do nothing;

insert into public.permissions (code, name, description) values
  ('vehicle.read', 'Read vehicles', null),
  ('vehicle.write', 'Create/update vehicles', null),
  ('maintenance.read', 'Read maintenance', null),
  ('maintenance.write', 'Create/update maintenance', null),
  ('maintenance.approve', 'Approve maintenance', null),
  ('odometer.write', 'Insert odometer', null),
  ('report.read', 'Read reports', null),
  ('export.run', 'Export data', null),
  ('backup.run', 'Run backup', null),
  ('audit.read', 'Read audit logs', null),
  ('user.manage', 'Manage users/roles', null)
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'SUPER_ADMIN'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'vehicle.read','vehicle.write','maintenance.read','maintenance.write',
  'odometer.write','report.read','export.run','audit.read'
)
where r.name = 'FLEET_ADMIN'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'vehicle.read','maintenance.read','maintenance.approve','report.read'
)
where r.name = 'SUPERVISOR'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('vehicle.read','maintenance.read','report.read')
where r.name = 'MANAGEMENT'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('odometer.write')
where r.name = 'DRIVER'
on conflict do nothing;

insert into public.departments (department_code, name, description) values
  ('GA', 'General Affairs', 'Kantor pusat'),
  ('OPS', 'Operasional', null),
  ('LOG', 'Logistik', null),
  ('MKT', 'Marketing', null),
  ('DIR', 'Direksi', null)
on conflict (department_code) do nothing;

insert into public.workshops (workshop_code, name, address, phone, contact_person) values
  ('WS-A', 'Auto Service A', 'Bogor', '0251-123456', 'Pak A'),
  ('WS-B', 'Auto Service B', 'Bogor', '0251-654321', 'Pak B'),
  ('WS-H', 'Honda Plaza', 'Jakarta', '021-889900', 'Service Advisor')
on conflict (workshop_code) do nothing;

insert into public.spareparts (part_code, part_name, category, unit, default_price, stock, minimum_stock) values
  ('OIL-5W30', 'Oli Mesin 5W-30', 'OIL', 'LTR', 120000, 40, 10),
  ('FIL-OIL', 'Filter Oli', 'FILTER', 'PCS', 85000, 20, 5),
  ('FIL-AIR', 'Filter Udara', 'FILTER', 'PCS', 150000, 15, 4),
  ('BRK-PAD', 'Kampas Rem', 'BRAKE', 'SET', 650000, 8, 2)
on conflict (part_code) do nothing;
