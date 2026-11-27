-- Keep privileged implementation functions out of the exposed API schema.
revoke all on function public.get_public_availability(text, uuid, uuid, date)
  from public, anon, authenticated;
revoke all on function public.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) from public, anon, authenticated;
revoke all on function public.change_appointment_status(
  uuid, public.appointment_status, text
) from public, anon, authenticated;
revoke all on function public.reschedule_appointment(uuid, timestamptz, text)
  from public, anon, authenticated;

alter function public.get_public_availability(text, uuid, uuid, date)
  set schema private;
alter function public.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) set schema private;
alter function public.change_appointment_status(
  uuid, public.appointment_status, text
) set schema private;
alter function public.reschedule_appointment(uuid, timestamptz, text)
  set schema private;

revoke all on function private.get_public_availability(text, uuid, uuid, date)
  from public, anon, authenticated;
revoke all on function private.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) from public, anon, authenticated;
revoke all on function private.change_appointment_status(
  uuid, public.appointment_status, text
) from public, anon, authenticated;
revoke all on function private.reschedule_appointment(uuid, timestamptz, text)
  from public, anon, authenticated;

grant usage on schema private to anon;
grant execute on function private.get_public_availability(text, uuid, uuid, date)
  to anon, authenticated;
grant execute on function private.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) to authenticated;
grant execute on function private.change_appointment_status(
  uuid, public.appointment_status, text
) to authenticated;
grant execute on function private.reschedule_appointment(uuid, timestamptz, text)
  to authenticated;

create function public.get_public_availability(
  target_business_slug text,
  target_branch_id uuid,
  target_service_id uuid,
  target_date date
)
returns table (
  staff_id uuid,
  staff_name text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_public_availability(
    target_business_slug,
    target_branch_id,
    target_service_id,
    target_date
  );
$$;

create function public.create_customer_appointment(
  target_business_slug text,
  target_branch_id uuid,
  target_service_id uuid,
  target_staff_id uuid,
  target_starts_at timestamptz,
  customer_name text,
  customer_phone text default null,
  customer_email text default null,
  customer_notes text default null
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_customer_appointment(
    target_business_slug,
    target_branch_id,
    target_service_id,
    target_staff_id,
    target_starts_at,
    customer_name,
    customer_phone,
    customer_email,
    customer_notes
  );
$$;

create function public.change_appointment_status(
  target_appointment_id uuid,
  target_status public.appointment_status,
  target_reason text default null
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.change_appointment_status(
    target_appointment_id,
    target_status,
    target_reason
  );
$$;

create function public.reschedule_appointment(
  target_appointment_id uuid,
  target_starts_at timestamptz,
  target_reason text default null
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.reschedule_appointment(
    target_appointment_id,
    target_starts_at,
    target_reason
  );
$$;

revoke all on function public.get_public_availability(text, uuid, uuid, date)
  from public, anon, authenticated;
grant execute on function public.get_public_availability(text, uuid, uuid, date)
  to anon, authenticated;

revoke all on function public.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) to authenticated;

revoke all on function public.change_appointment_status(
  uuid, public.appointment_status, text
) from public, anon, authenticated;
grant execute on function public.change_appointment_status(
  uuid, public.appointment_status, text
) to authenticated;

revoke all on function public.reschedule_appointment(uuid, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.reschedule_appointment(uuid, timestamptz, text)
  to authenticated;

-- Cover tenant composite foreign keys and common authorization joins.
create index businesses_created_by_idx
  on public.businesses(created_by);
create index staff_profiles_user_idx
  on public.staff_profiles(user_id)
  where user_id is not null;
create index appointments_business_branch_idx
  on public.appointments(business_id, branch_id);
create index appointments_business_staff_idx
  on public.appointments(business_id, staff_id)
  where staff_id is not null;
create index appointments_created_by_idx
  on public.appointments(created_by)
  where created_by is not null;
create index appointment_services_business_appointment_idx
  on public.appointment_services(business_id, appointment_id);
create index appointment_services_business_service_idx
  on public.appointment_services(business_id, service_id)
  where service_id is not null;
create index appointment_history_business_appointment_idx
  on public.appointment_status_history(business_id, appointment_id);
create index appointment_history_changed_by_idx
  on public.appointment_status_history(changed_by)
  where changed_by is not null;
create index staff_services_business_staff_idx
  on public.staff_services(business_id, staff_id);
create index staff_services_business_service_idx
  on public.staff_services(business_id, service_id);
create index staff_working_hours_business_staff_idx
  on public.staff_working_hours(business_id, staff_id);
