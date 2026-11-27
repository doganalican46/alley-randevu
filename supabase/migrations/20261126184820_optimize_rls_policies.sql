-- Consolidate permissive SELECT policies and keep write policies action-specific.

drop policy businesses_public_read on public.businesses;
drop policy businesses_member_read on public.businesses;

create policy businesses_public_read
on public.businesses for select to anon
using (is_published and status = 'active');

create policy businesses_authenticated_read
on public.businesses for select to authenticated
using (
  (is_published and status = 'active')
  or private.is_business_member(id)
);

drop policy branches_public_read on public.branches;
drop policy branches_member_read on public.branches;
drop policy branches_manage on public.branches;

create policy branches_public_read
on public.branches for select to anon
using (
  is_active
  and exists (
    select 1 from public.businesses business
    where business.id = branches.business_id
      and business.is_published
      and business.status = 'active'
  )
);

create policy branches_authenticated_read
on public.branches for select to authenticated
using (
  private.is_business_member(business_id)
  or (
    is_active
    and exists (
      select 1 from public.businesses business
      where business.id = branches.business_id
        and business.is_published
        and business.status = 'active'
    )
  )
);

create policy branches_insert_authorized
on public.branches for insert to authenticated
with check (private.has_business_permission(business_id, 'branches.manage'));

create policy branches_update_authorized
on public.branches for update to authenticated
using (private.has_business_permission(business_id, 'branches.manage'))
with check (private.has_business_permission(business_id, 'branches.manage'));

create policy branches_delete_authorized
on public.branches for delete to authenticated
using (private.has_business_permission(business_id, 'branches.manage'));

drop policy services_public_read on public.services;
drop policy services_member_read on public.services;
drop policy services_manage on public.services;

create policy services_public_read
on public.services for select to anon
using (
  is_active
  and exists (
    select 1 from public.businesses business
    where business.id = services.business_id
      and business.is_published
      and business.status = 'active'
  )
);

create policy services_authenticated_read
on public.services for select to authenticated
using (
  private.is_business_member(business_id)
  or (
    is_active
    and exists (
      select 1 from public.businesses business
      where business.id = services.business_id
        and business.is_published
        and business.status = 'active'
    )
  )
);

create policy services_insert_authorized
on public.services for insert to authenticated
with check (private.has_business_permission(business_id, 'services.manage'));

create policy services_update_authorized
on public.services for update to authenticated
using (private.has_business_permission(business_id, 'services.manage'))
with check (private.has_business_permission(business_id, 'services.manage'));

create policy services_delete_authorized
on public.services for delete to authenticated
using (private.has_business_permission(business_id, 'services.manage'));

drop policy staff_profiles_member_read on public.staff_profiles;
drop policy staff_profiles_manage on public.staff_profiles;

create policy staff_profiles_read
on public.staff_profiles for select to authenticated
using (private.is_business_member(business_id));

create policy staff_profiles_insert_authorized
on public.staff_profiles for insert to authenticated
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy staff_profiles_update_authorized
on public.staff_profiles for update to authenticated
using (private.has_business_permission(business_id, 'staff.manage'))
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy staff_profiles_delete_authorized
on public.staff_profiles for delete to authenticated
using (private.has_business_permission(business_id, 'staff.manage'));

drop policy staff_services_member_read on public.staff_services;
drop policy staff_services_manage on public.staff_services;

create policy staff_services_read
on public.staff_services for select to authenticated
using (private.is_business_member(business_id));

create policy staff_services_insert_authorized
on public.staff_services for insert to authenticated
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy staff_services_update_authorized
on public.staff_services for update to authenticated
using (private.has_business_permission(business_id, 'staff.manage'))
with check (private.has_business_permission(business_id, 'staff.manage'));

create policy staff_services_delete_authorized
on public.staff_services for delete to authenticated
using (private.has_business_permission(business_id, 'staff.manage'));

drop policy appointment_services_read_authorized on public.appointment_services;
drop policy appointment_services_manage on public.appointment_services;

create policy appointment_services_read
on public.appointment_services for select to authenticated
using (
  exists (
    select 1 from public.appointments appointment
    where appointment.id = appointment_services.appointment_id
      and appointment.business_id = appointment_services.business_id
      and (
        appointment.customer_id = (select auth.uid())
        or private.has_business_permission(
          appointment.business_id,
          'appointments.read'
        )
      )
  )
);

create policy appointment_services_insert_authorized
on public.appointment_services for insert to authenticated
with check (private.has_business_permission(business_id, 'appointments.create'));

create policy appointment_services_update_authorized
on public.appointment_services for update to authenticated
using (private.has_business_permission(business_id, 'appointments.update'))
with check (private.has_business_permission(business_id, 'appointments.create'));
