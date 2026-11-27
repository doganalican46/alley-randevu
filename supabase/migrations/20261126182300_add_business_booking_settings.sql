-- Business-level scheduling rules used by both the management UI and booking RPCs.

alter table public.businesses
  add column booking_interval_minutes integer not null default 15
    check (booking_interval_minutes in (5, 10, 15, 20, 30, 60)),
  add column minimum_booking_notice_minutes integer not null default 60
    check (minimum_booking_notice_minutes between 0 and 10080),
  add column maximum_booking_days integer not null default 90
    check (maximum_booking_days between 1 and 365),
  add column cancellation_notice_hours integer not null default 24
    check (cancellation_notice_hours between 0 and 720),
  add column auto_confirm_appointments boolean not null default false;

-- Keep database authorization aligned with the application permission matrix.
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
        or required_permission = any(member.permissions)
        or (
          member.role = 'admin'
          and required_permission = any(array[
            'appointments.read',
            'appointments.create',
            'appointments.update',
            'appointments.cancel',
            'appointments.manage_all',
            'customers.read',
            'customers.manage',
            'services.manage',
            'staff.manage',
            'branches.manage',
            'reports.view',
            'settings.manage'
          ])
        )
        or (
          member.role = 'branch_manager'
          and required_permission = any(array[
            'appointments.read',
            'appointments.create',
            'appointments.update',
            'appointments.cancel',
            'appointments.manage_all',
            'customers.read',
            'customers.manage',
            'reports.view'
          ])
        )
        or (
          member.role = 'receptionist'
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
      )
  );
$$;
