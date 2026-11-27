begin;
select plan(7);

insert into auth.users (id, email)
values
  ('51111111-1111-1111-1111-111111111111', 'booking-owner@example.test'),
  ('52222222-2222-2222-2222-222222222222', 'booking-customer@example.test'),
  ('53333333-3333-3333-3333-333333333333', 'booking-outsider@example.test');

set local request.jwt.claim.sub = '51111111-1111-1111-1111-111111111111';

insert into public.businesses (
  id, created_by, name, slug, status, is_published,
  minimum_booking_notice_minutes, cancellation_notice_hours
)
values (
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51111111-1111-1111-1111-111111111111',
  'Booking Tenant',
  'booking-tenant',
  'active',
  true,
  0,
  0
);

insert into public.branches (id, business_id, name, slug, is_primary)
values (
  'e1000000-0000-0000-0000-000000000001',
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Main Branch',
  'main',
  true
);

insert into public.services (
  id, business_id, name, duration_minutes, price
)
values (
  'e2000000-0000-0000-0000-000000000001',
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Booking Service',
  30,
  500
);

insert into public.staff_profiles (id, business_id, display_name)
values (
  'e3000000-0000-0000-0000-000000000001',
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Booking Staff'
);

insert into public.staff_services (business_id, staff_id, service_id)
values (
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'e3000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0000-000000000001'
);

insert into public.staff_working_hours (
  business_id, branch_id, staff_id, weekday, starts_at, ends_at
)
values (
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'e1000000-0000-0000-0000-000000000001',
  'e3000000-0000-0000-0000-000000000001',
  extract(dow from current_date + 2)::smallint,
  '00:00',
  '23:59'
);

set local role anon;

select isnt_empty(
  $$select starts_at from public.get_public_availability(
    'booking-tenant',
    'e1000000-0000-0000-0000-000000000001',
    'e2000000-0000-0000-0000-000000000001',
    current_date + 2
  )$$,
  'anonymous visitor can read safe aggregated availability'
);

select throws_ok(
  $$select public.create_customer_appointment(
    'booking-tenant',
    'e1000000-0000-0000-0000-000000000001',
    'e2000000-0000-0000-0000-000000000001',
    'e3000000-0000-0000-0000-000000000001',
    now() + interval '2 days',
    'Anonymous Customer'
  )$$,
  '42501',
  null,
  'anonymous visitor cannot call the booking transaction'
);

reset role;

create temporary table booking_test_slot as
select staff_id, starts_at
from public.get_public_availability(
  'booking-tenant',
  'e1000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0000-000000000001',
  current_date + 2
)
order by starts_at
limit 1;

grant select on booking_test_slot to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = '52222222-2222-2222-2222-222222222222';

select lives_ok(
  $$select public.create_customer_appointment(
    'booking-tenant',
    'e1000000-0000-0000-0000-000000000001',
    'e2000000-0000-0000-0000-000000000001',
    (select staff_id from booking_test_slot),
    (select starts_at from booking_test_slot),
    'Verified Customer',
    '+905551112233',
    'booking-customer@example.test'
  )$$,
  'authenticated customer can create a transaction-safe appointment'
);

select results_eq(
  $$select count(*)::integer from public.appointments$$,
  array[1],
  'customer reads exactly their own appointment'
);

select throws_ok(
  $$select public.create_customer_appointment(
    'booking-tenant',
    'e1000000-0000-0000-0000-000000000001',
    'e2000000-0000-0000-0000-000000000001',
    (select staff_id from booking_test_slot),
    (select starts_at from booking_test_slot),
    'Verified Customer'
  )$$,
  'P0001',
  'APPOINTMENT_NOT_AVAILABLE',
  'the same staff slot cannot be booked twice'
);

select lives_ok(
  $$select public.change_appointment_status(
    (select id from public.appointments limit 1),
    'CANCELLED',
    'customer_request'
  )$$,
  'customer can cancel within the configured window'
);

set local request.jwt.claim.sub = '53333333-3333-3333-3333-333333333333';

select is_empty(
  $$select id from public.appointments$$,
  'another customer cannot read the appointment'
);

select * from finish();
rollback;
