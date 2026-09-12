# VMMS — ERD Final (Phase 2)

Sumber kebenaran: MASTER HANDOVER. Database = PostgreSQL (Supabase). File besar di Storage, bukan di tabel.

```
profiles ── user_roles ── roles ── role_permissions ── permissions

departments ─┐
drivers ─────┼── vehicle_assignments ── vehicles
             │                              │
workshops ───┼── maintenance ───────────────┤
spareparts ──┼── maintenance_parts          │
             ├── maintenance_items          ├── odometer_logs
             └── expenses                   ├── vehicle_status_logs
                                            ├── maintenance_schedules
                                            ├── vehicle_documents
                                            └── attachments

notifications (user_id)
audit_logs (immutable)
export_logs
backup_logs
```

## Relasi inti

- **vehicles** tidak menyimpan `department_id` / `driver_id` historis. Penempatan = `vehicle_assignments` (`end_date IS NULL` = aktif).
- Satu kendaraan tidak boleh punya dua assignment aktif yang overlap.
- **maintenance** → items, parts, expenses.
- **odometer_logs** kronologis; KM tidak boleh turun kecuali permission khusus + audit.
- Soft-delete / `active` untuk master; tidak hard-delete histori.

## Status (CHECK)

- Vehicle: READY | OPERATIONAL | WARNING | MAINTENANCE | ACCIDENT | INACTIVE | SOLD
- Maintenance: DRAFT | SUBMITTED | APPROVED | IN_PROGRESS | COMPLETED | CANCELLED
- Schedule: NORMAL | DUE_SOON | DUE | OVERDUE | COMPLETED
- Role: SUPER_ADMIN | FLEET_ADMIN | SUPERVISOR | MANAGEMENT | DRIVER
