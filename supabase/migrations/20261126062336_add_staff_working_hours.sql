create table public.staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null,
  staff_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time without time zone not null,
  ends_at time without time zone not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (business_id, branch_id, staff_id, weekday),
  foreign key (business_id, branch_id)
    references public.branches(business_id, id) on delete cascade,
  foreign key (business_id, staff_id)
    references public.staff_profiles(business_id, id) on delete cascade
);

create index staff_working_hours_lookup_idx
on public.staff_working_hours(business_id, branch_id, staff_id, weekday)
where is_active;

create trigger staff_working_hours_set_updated_at
before update on public.staff_working_hours
for each row execute function private.set_updated_at();

alter table public.staff_working_hours enable row level security;

revoke all on table public.staff_working_hours from public, anon, authenticated;
grant select, insert, update, delete on table public.staff_working_hours to authenticated;

create policy staff_working_hours_member_read
on public.staff_working_hours for select to authenticated
using (private.is_business_member(business_id));

create policy staff_working_hours_insert
on public.staff_working_hours for insert to authenticated
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy staff_working_hours_update
on public.staff_working_hours for update to authenticated
using (private.has_business_permission(business_id, 'staff.manage'))
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy staff_working_hours_delete
on public.staff_working_hours for delete to authenticated
using (private.has_business_permission(business_id, 'staff.manage'));

create or replace function public.replace_staff_services(
  target_business_id uuid,
  target_staff_id uuid,
  target_service_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.has_business_permission(target_business_id, 'staff.manage')) then
    raise exception 'Staff management permission is required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.staff_profiles staff
    where staff.business_id = target_business_id
      and staff.id = target_staff_id
  ) then
    raise exception 'Staff profile does not belong to the business'
      using errcode = '22023';
  end if;

  delete from public.staff_services
  where business_id = target_business_id
    and staff_id = target_staff_id;

  insert into public.staff_services (business_id, staff_id, service_id)
  select target_business_id, target_staff_id, service_id
  from unnest(target_service_ids) as service_id;
end;
$$;

revoke all on function public.replace_staff_services(uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.replace_staff_services(uuid, uuid, uuid[]) to authenticated;
