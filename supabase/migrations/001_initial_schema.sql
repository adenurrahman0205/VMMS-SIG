-- VMMS 001 — extensions, updated_at trigger, core enums via CHECK

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Generic BEFORE UPDATE trigger: set updated_at = now()';
