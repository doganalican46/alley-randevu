-- Public availability is read-only and returns no customer data.
create or replace function public.get_public_availability(
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
security definer
set search_path = ''
as $$
  select
    staff.id,
    staff.display_name,
    slot.starts_at,
    slot.starts_at + make_interval(mins => service.duration_minutes)
  from public.businesses business
  join public.branches branch
    on branch.business_id = business.id
   and branch.id = target_branch_id
   and branch.is_active
  join public.services service
    on service.business_id = business.id
   and service.id = target_service_id
   and service.is_active
  join public.staff_services assignment
    on assignment.business_id = business.id
   and assignment.service_id = service.id
  join public.staff_profiles staff
    on staff.business_id = business.id
   and staff.id = assignment.staff_id
   and staff.is_active
   and staff.is_bookable
  join public.staff_working_hours hours
    on hours.business_id = business.id
   and hours.branch_id = branch.id
   and hours.staff_id = staff.id
   and hours.weekday = extract(dow from target_date)::smallint
   and hours.is_active
  cross join lateral generate_series(
    ((target_date + hours.starts_at) at time zone branch.timezone)
      + make_interval(mins => service.buffer_before_minutes),
    ((target_date + hours.ends_at) at time zone branch.timezone)
      - make_interval(mins => service.duration_minutes + service.buffer_after_minutes),
    make_interval(mins => business.booking_interval_minutes)
  ) as slot(starts_at)
  where business.slug = target_business_slug
    and business.status = 'active'
    and business.is_published
    and target_date >= (now() at time zone business.timezone)::date
    and target_date <= (now() at time zone business.timezone)::date + business.maximum_booking_days
    and slot.starts_at >= now() + make_interval(mins => business.minimum_booking_notice_minutes)
    and not exists (
      select 1
      from public.appointments appointment
      where appointment.business_id = business.id
        and appointment.staff_id = staff.id
        and appointment.status in ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
        and tstzrange(appointment.starts_at, appointment.ends_at, '[)') &&
          tstzrange(
            slot.starts_at - make_interval(mins => service.buffer_before_minutes),
            slot.starts_at + make_interval(
              mins => service.duration_minutes + service.buffer_after_minutes
            ),
            '[)'
          )
    )
  order by slot.starts_at, staff.display_name;
$$;

revoke all on function public.get_public_availability(text, uuid, uuid, date)
  from public, anon, authenticated;
grant execute on function public.get_public_availability(text, uuid, uuid, date)
  to anon, authenticated;

create or replace function public.create_customer_appointment(
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  selected_business public.businesses%rowtype;
  selected_service public.services%rowtype;
  appointment_id uuid;
  appointment_end timestamptz;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '28000';
  end if;

  if char_length(trim(customer_name)) not between 2 and 120 then
    raise exception 'INVALID_CUSTOMER_NAME' using errcode = '22023';
  end if;

  select business.*
    into selected_business
  from public.businesses business
  where business.slug = target_business_slug
    and business.status = 'active'
    and business.is_published;

  if not found then
    raise exception 'BUSINESS_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  select service.*
    into selected_service
  from public.services service
  where service.id = target_service_id
    and service.business_id = selected_business.id
    and service.is_active;

  if not found then
    raise exception 'SERVICE_NOT_AVAILABLE' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.get_public_availability(
      target_business_slug,
      target_branch_id,
      target_service_id,
      (target_starts_at at time zone selected_business.timezone)::date
    ) availability
    where availability.staff_id = target_staff_id
      and availability.starts_at = target_starts_at
  ) then
    raise exception 'APPOINTMENT_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  appointment_end := target_starts_at
    + make_interval(mins => selected_service.duration_minutes);

  insert into public.appointments (
    business_id,
    branch_id,
    customer_id,
    staff_id,
    status,
    starts_at,
    ends_at,
    customer_name_snapshot,
    customer_phone_snapshot,
    customer_email_snapshot,
    total_amount,
    currency,
    public_notes,
    created_by
  )
  values (
    selected_business.id,
    target_branch_id,
    caller_id,
    target_staff_id,
    case
      when selected_business.auto_confirm_appointments then 'CONFIRMED'::public.appointment_status
      else 'PENDING'::public.appointment_status
    end,
    target_starts_at,
    appointment_end,
    trim(customer_name),
    nullif(trim(customer_phone), ''),
    nullif(trim(customer_email), ''),
    selected_service.price,
    selected_service.currency,
    nullif(trim(customer_notes), ''),
    caller_id
  )
  returning id into appointment_id;

  insert into public.appointment_services (
    business_id,
    appointment_id,
    service_id,
    service_name_snapshot,
    duration_minutes_snapshot,
    price_snapshot,
    currency_snapshot,
    sort_order
  )
  values (
    selected_business.id,
    appointment_id,
    selected_service.id,
    selected_service.name,
    selected_service.duration_minutes,
    selected_service.price,
    selected_service.currency,
    0
  );

  insert into public.appointment_status_history (
    business_id,
    appointment_id,
    previous_status,
    new_status,
    changed_by,
    change_reason
  )
  values (
    selected_business.id,
    appointment_id,
    null,
    case
      when selected_business.auto_confirm_appointments then 'CONFIRMED'::public.appointment_status
      else 'PENDING'::public.appointment_status
    end,
    caller_id,
    'customer_booking'
  );

  return appointment_id;
exception
  when exclusion_violation then
    raise exception 'APPOINTMENT_CONFLICT' using errcode = '23P01';
end;
$$;

revoke all on function public.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.create_customer_appointment(
  text, uuid, uuid, uuid, timestamptz, text, text, text, text
) to authenticated;

create or replace function private.validate_appointment_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed boolean := false;
  reason text := nullif(current_setting('app.change_reason', true), '');
begin
  if old.status = new.status then
    return new;
  end if;

  allowed := case old.status
    when 'PENDING' then new.status in ('CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED')
    when 'CONFIRMED' then new.status in ('CHECKED_IN', 'CANCELLED', 'NO_SHOW')
    when 'CHECKED_IN' then new.status in ('IN_PROGRESS', 'CANCELLED')
    when 'IN_PROGRESS' then new.status = 'COMPLETED'
    else false
  end;

  if not allowed then
    raise exception 'Invalid appointment status transition from % to %', old.status, new.status
      using errcode = '22023';
  end if;

  insert into public.appointment_status_history (
    business_id,
    appointment_id,
    previous_status,
    new_status,
    changed_by,
    change_reason,
    changes
  )
  values (
    new.business_id,
    new.id,
    old.status,
    new.status,
    (select auth.uid()),
    reason,
    jsonb_build_object('starts_at', new.starts_at, 'ends_at', new.ends_at)
  );

  return new;
end;
$$;

create or replace function public.change_appointment_status(
  target_appointment_id uuid,
  target_status public.appointment_status,
  target_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  selected_appointment public.appointments%rowtype;
  cancellation_hours integer;
  staff_allowed boolean;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '28000';
  end if;

  select appointment.*
    into selected_appointment
  from public.appointments appointment
  where appointment.id = target_appointment_id
  for update;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  select business.cancellation_notice_hours
    into cancellation_hours
  from public.businesses business
  where business.id = selected_appointment.business_id;

  staff_allowed :=
    private.has_business_permission(selected_appointment.business_id, 'appointments.update')
    or (
      target_status = 'CANCELLED'
      and private.has_business_permission(
        selected_appointment.business_id,
        'appointments.cancel'
      )
    );

  if selected_appointment.customer_id = caller_id then
    if target_status <> 'CANCELLED' then
      raise exception 'CUSTOMER_STATUS_FORBIDDEN' using errcode = '42501';
    end if;

    if selected_appointment.starts_at <
      now() + make_interval(hours => cancellation_hours) then
      raise exception 'CANCELLATION_WINDOW_CLOSED' using errcode = 'P0001';
    end if;
  elsif not staff_allowed then
    raise exception 'APPOINTMENT_ACCESS_DENIED' using errcode = '42501';
  end if;

  perform set_config('app.change_reason', coalesce(target_reason, ''), true);

  update public.appointments
  set status = target_status
  where id = target_appointment_id;
end;
$$;

revoke all on function public.change_appointment_status(
  uuid, public.appointment_status, text
) from public, anon, authenticated;
grant execute on function public.change_appointment_status(
  uuid, public.appointment_status, text
) to authenticated;

create or replace function public.reschedule_appointment(
  target_appointment_id uuid,
  target_starts_at timestamptz,
  target_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  selected_appointment public.appointments%rowtype;
  selected_business public.businesses%rowtype;
  selected_service public.appointment_services%rowtype;
  cancellation_hours integer;
  target_end timestamptz;
  staff_allowed boolean;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '28000';
  end if;

  select appointment.*
    into selected_appointment
  from public.appointments appointment
  where appointment.id = target_appointment_id
  for update;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  select business.*
    into selected_business
  from public.businesses business
  where business.id = selected_appointment.business_id;

  cancellation_hours := selected_business.cancellation_notice_hours;

  select appointment_service.*
    into selected_service
  from public.appointment_services appointment_service
  where appointment_service.appointment_id = selected_appointment.id
  order by appointment_service.sort_order
  limit 1;

  staff_allowed := private.has_business_permission(
    selected_appointment.business_id,
    'appointments.update'
  );

  if selected_appointment.customer_id = caller_id then
    if selected_appointment.starts_at <
      now() + make_interval(hours => cancellation_hours) then
      raise exception 'RESCHEDULE_WINDOW_CLOSED' using errcode = 'P0001';
    end if;
  elsif not staff_allowed then
    raise exception 'APPOINTMENT_ACCESS_DENIED' using errcode = '42501';
  end if;

  if selected_appointment.status not in ('PENDING', 'CONFIRMED') then
    raise exception 'APPOINTMENT_NOT_RESCHEDULABLE' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.get_public_availability(
      selected_business.slug,
      selected_appointment.branch_id,
      selected_service.service_id,
      (target_starts_at at time zone selected_business.timezone)::date
    ) availability
    where availability.staff_id = selected_appointment.staff_id
      and availability.starts_at = target_starts_at
  ) then
    raise exception 'APPOINTMENT_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  target_end := target_starts_at
    + make_interval(mins => selected_service.duration_minutes_snapshot);

  update public.appointments
  set starts_at = target_starts_at,
      ends_at = target_end
  where id = target_appointment_id;

  insert into public.appointment_status_history (
    business_id,
    appointment_id,
    previous_status,
    new_status,
    changed_by,
    change_reason,
    changes
  )
  values (
    selected_appointment.business_id,
    selected_appointment.id,
    selected_appointment.status,
    selected_appointment.status,
    caller_id,
    coalesce(nullif(trim(target_reason), ''), 'rescheduled'),
    jsonb_build_object(
      'previous_starts_at', selected_appointment.starts_at,
      'previous_ends_at', selected_appointment.ends_at,
      'starts_at', target_starts_at,
      'ends_at', target_end
    )
  );
exception
  when exclusion_violation then
    raise exception 'APPOINTMENT_CONFLICT' using errcode = '23P01';
end;
$$;

revoke all on function public.reschedule_appointment(uuid, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.reschedule_appointment(uuid, timestamptz, text)
  to authenticated;
