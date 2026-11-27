-- Alley Randevu initial multi-tenant foundation.
-- All public tables use RLS. Tenant authorization is derived from auth.uid(),
-- never from user-editable JWT metadata.

create extension if not exists btree_gist with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.business_status as enum ('draft', 'active', 'suspended', 'archived');
create type public.business_role as enum ('owner', 'admin', 'branch_manager', 'receptionist', 'staff');
create type public.appointment_status as enum (
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'NO_SHOW',
  'EXPIRED'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_path text,
  phone text,
  locale text not null default 'tr' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  timezone text not null default 'Europe/Istanbul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  description text,
  timezone text not null default 'Europe/Istanbul',
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  status public.business_status not null default 'draft',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.business_role not null,
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  address_line text,
  phone text,
  timezone text not null default 'Europe/Istanbul',
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug),
  unique (business_id, id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes between 0 and 240),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes between 0 and 240),
  price numeric(12, 2) not null default 0 check (price >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 2 and 120),
  title text,
  is_bookable boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (business_id, user_id),
  unique (business_id, id)
);

create table public.staff_services (
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (staff_id, service_id),
  foreign key (business_id, staff_id)
    references public.staff_profiles(business_id, id) on delete cascade,
  foreign key (business_id, service_id)
    references public.services(business_id, id) on delete cascade
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  branch_id uuid not null,
  customer_id uuid references auth.users(id) on delete set null,
  staff_id uuid,
  status public.appointment_status not null default 'PENDING',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  customer_name_snapshot text not null,
  customer_phone_snapshot text,
  customer_email_snapshot text,
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  public_notes text,
  internal_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (business_id, id),
  foreign key (business_id, branch_id)
    references public.branches(business_id, id) on delete restrict,
  foreign key (business_id, staff_id)
    references public.staff_profiles(business_id, id) on delete restrict
);

create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  appointment_id uuid not null,
  service_id uuid,
  service_name_snapshot text not null,
  duration_minutes_snapshot integer not null check (duration_minutes_snapshot > 0),
  price_snapshot numeric(12, 2) not null check (price_snapshot >= 0),
  currency_snapshot text not null check (currency_snapshot ~ '^[A-Z]{3}$'),
  sort_order integer not null default 0,
  foreign key (business_id, appointment_id)
    references public.appointments(business_id, id) on delete cascade,
  foreign key (business_id, service_id)
    references public.services(business_id, id) on delete set null
);

create table public.appointment_status_history (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete restrict,
  appointment_id uuid not null,
  previous_status public.appointment_status,
  new_status public.appointment_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_reason text,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (business_id, appointment_id)
    references public.appointments(business_id, id) on delete cascade
);

create index business_members_user_idx on public.business_members(user_id, business_id) where is_active;
create index branches_business_idx on public.branches(business_id) where is_active;
create index services_business_idx on public.services(business_id, sort_order) where is_active;
create index staff_profiles_business_idx on public.staff_profiles(business_id) where is_active;
create index appointments_business_starts_idx on public.appointments(business_id, starts_at);
create index appointments_customer_idx on public.appointments(customer_id, starts_at) where customer_id is not null;
create index appointment_history_appointment_idx on public.appointment_status_history(appointment_id, created_at desc);

alter table public.appointments
  add constraint appointments_staff_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (staff_id is not null and status in ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'));

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
for each row execute function private.set_updated_at();
create trigger branches_set_updated_at before update on public.branches
for each row execute function private.set_updated_at();
create trigger services_set_updated_at before update on public.services
for each row execute function private.set_updated_at();
create trigger staff_profiles_set_updated_at before update on public.staff_profiles
for each row execute function private.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.add_business_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by <> (select auth.uid()) then
    raise exception 'Business owner must match the authenticated user';
  end if;

  insert into public.business_members (business_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_business_created
after insert on public.businesses
for each row execute function private.add_business_owner();

create or replace function private.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.business_members member
      where member.business_id = target_business_id
        and member.user_id = (select auth.uid())
        and member.is_active
    );
$$;

create or replace function private.has_business_permission(
  target_business_id uuid,
  required_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members member
    where member.business_id = target_business_id
      and member.user_id = (select auth.uid())
      and member.is_active
      and (
        member.role = 'owner'
        or (member.role = 'admin' and required_permission not like 'billing.%')
        or (
          member.role in ('branch_manager', 'receptionist')
          and required_permission = any(array[
            'appointments.read',
            'appointments.create',
            'appointments.update',
            'appointments.cancel',
            'customers.read',
            'customers.manage'
          ])
        )
        or (
          member.role = 'staff'
          and required_permission = any(array[
            'appointments.read',
            'appointments.update',
            'customers.read'
          ])
        )
        or required_permission = any(member.permissions)
      )
  );
$$;

create or replace function private.validate_appointment_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed boolean := false;
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
    changes
  )
  values (
    new.business_id,
    new.id,
    old.status,
    new.status,
    (select auth.uid()),
    jsonb_build_object('starts_at', new.starts_at, 'ends_at', new.ends_at)
  );

  return new;
end;
$$;

create trigger validate_appointment_transition
before update of status on public.appointments
for each row execute function private.validate_appointment_transition();

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_business_member(uuid) to authenticated;
grant execute on function private.has_business_permission(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.branches enable row level security;
alter table public.services enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.staff_services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.appointment_status_history enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select on public.businesses, public.branches, public.services to anon;
grant select, insert, update, delete on public.branches, public.services, public.staff_profiles, public.staff_services to authenticated;
grant select, insert, update on public.appointments, public.appointment_services to authenticated;
grant select on public.appointment_status_history to authenticated;
grant usage, select on sequence public.appointment_status_history_id_seq to authenticated;

create policy profiles_select_own
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy businesses_public_read
on public.businesses for select to anon, authenticated
using (is_published and status = 'active');

create policy businesses_member_read
on public.businesses for select to authenticated
using (private.is_business_member(id));

create policy businesses_create_own
on public.businesses for insert to authenticated
with check ((select auth.uid()) = created_by);

create policy businesses_update_authorized
on public.businesses for update to authenticated
using (private.has_business_permission(id, 'settings.manage'))
with check (private.has_business_permission(id, 'settings.manage'));

create policy business_members_read
on public.business_members for select to authenticated
using (user_id = (select auth.uid()) or private.is_business_member(business_id));

create policy business_members_insert
on public.business_members for insert to authenticated
with check (
  role <> 'owner'
  and private.has_business_permission(business_id, 'staff.manage')
);

create policy business_members_update
on public.business_members for update to authenticated
using (
  role <> 'owner'
  and private.has_business_permission(business_id, 'staff.manage')
)
with check (
  role <> 'owner'
  and private.has_business_permission(business_id, 'staff.manage')
);

create policy business_members_delete
on public.business_members for delete to authenticated
using (
  role <> 'owner'
  and private.has_business_permission(business_id, 'staff.manage')
);

create policy branches_public_read
on public.branches for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.businesses business
    where business.id = branches.business_id
      and business.is_published
      and business.status = 'active'
  )
);

create policy branches_member_read
on public.branches for select to authenticated
using (private.is_business_member(business_id));

create policy branches_manage
on public.branches for all to authenticated
using (private.has_business_permission(business_id, 'branches.manage'))
with check (private.has_business_permission(business_id, 'branches.manage'));

create policy services_public_read
on public.services for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.businesses business
    where business.id = services.business_id
      and business.is_published
      and business.status = 'active'
  )
);

create policy services_member_read
on public.services for select to authenticated
using (private.is_business_member(business_id));

create policy services_manage
on public.services for all to authenticated
using (private.has_business_permission(business_id, 'services.manage'))
with check (private.has_business_permission(business_id, 'services.manage'));

create policy staff_profiles_member_read
on public.staff_profiles for select to authenticated
using (private.is_business_member(business_id));

create policy staff_profiles_manage
on public.staff_profiles for all to authenticated
using (private.has_business_permission(business_id, 'staff.manage'))
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy staff_services_member_read
on public.staff_services for select to authenticated
using (private.is_business_member(business_id));

create policy staff_services_manage
on public.staff_services for all to authenticated
using (private.has_business_permission(business_id, 'staff.manage'))
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy appointments_read_authorized
on public.appointments for select to authenticated
using (
  customer_id = (select auth.uid())
  or private.has_business_permission(business_id, 'appointments.read')
);

create policy appointments_create_staff
on public.appointments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_business_permission(business_id, 'appointments.create')
);

create policy appointments_update_staff
on public.appointments for update to authenticated
using (private.has_business_permission(business_id, 'appointments.update'))
with check (private.has_business_permission(business_id, 'appointments.update'));

create policy appointment_services_read_authorized
on public.appointment_services for select to authenticated
using (
  exists (
    select 1 from public.appointments appointment
    where appointment.id = appointment_services.appointment_id
      and appointment.business_id = appointment_services.business_id
      and (
        appointment.customer_id = (select auth.uid())
        or private.has_business_permission(appointment.business_id, 'appointments.read')
      )
  )
);

create policy appointment_services_manage
on public.appointment_services for all to authenticated
using (private.has_business_permission(business_id, 'appointments.update'))
with check (private.has_business_permission(business_id, 'appointments.create'));

create policy appointment_history_read
on public.appointment_status_history for select to authenticated
using (private.has_business_permission(business_id, 'appointments.read'));
