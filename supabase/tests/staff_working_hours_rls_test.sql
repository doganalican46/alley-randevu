begin;
select plan(15);

insert into auth.users (id, email)
values
  ('41111111-1111-1111-1111-111111111111', 'hours-owner-a@example.test'),
  ('42222222-2222-2222-2222-222222222222', 'hours-owner-b@example.test'),
  ('43333333-3333-3333-3333-333333333333', 'hours-staff-a@example.test');

set local request.jwt.claim.sub = '41111111-1111-1111-1111-111111111111';

insert into public.businesses (id, created_by, name, slug)
values (
  'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '41111111-1111-1111-1111-111111111111',
  'Hours Tenant A',
  'hours-tenant-a'
);

set local request.jwt.claim.sub = '42222222-2222-2222-2222-222222222222';

insert into public.businesses (id, created_by, name, slug)
values (
  'dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '42222222-2222-2222-2222-222222222222',
  'Hours Tenant B',
  'hours-tenant-b'
);

insert into public.business_members (business_id, user_id, role)
values (
  'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '43333333-3333-3333-3333-333333333333',
  'staff'
);

insert into public.branches (id, business_id, name, slug)
values
  (
    'd1000000-0000-0000-0000-000000000001',
    'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Branch A',
    'branch-a'
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Branch B',
    'branch-b'
  );

insert into public.staff_profiles (id, business_id, display_name)
values
  (
    'd2000000-0000-0000-0000-000000000001',
    'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Staff A'
  ),
  (
    'd2000000-0000-0000-0000-000000000002',
    'dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Staff B'
  );

insert into public.services (id, business_id, name, duration_minutes)
values (
  'd4000000-0000-0000-0000-000000000001',
  'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Service A',
  30
);

set local role anon;

select throws_ok(
  $$select id from public.staff_working_hours$$,
  '42501',
  null,
  'anonymous users hold no working-hours select grant'
);

select throws_ok(
  $$insert into public.staff_working_hours (
      business_id, branch_id, staff_id, weekday, starts_at, ends_at
    ) values (
      'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'd1000000-0000-0000-0000-000000000001',
      'd2000000-0000-0000-0000-000000000001',
      1,
      '09:00',
      '18:00'
    )$$,
  '42501',
  null,
  'anonymous users hold no working-hours insert grant'
);

set local role authenticated;
set local request.jwt.claim.sub = '41111111-1111-1111-1111-111111111111';

select lives_ok(
  $$insert into public.staff_working_hours (
      id, business_id, branch_id, staff_id, weekday, starts_at, ends_at
    ) values (
      'd3000000-0000-0000-0000-000000000001',
      'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'd1000000-0000-0000-0000-000000000001',
      'd2000000-0000-0000-0000-000000000001',
      1,
      '09:00',
      '18:00'
    )$$,
  'owner can create working hours in their tenant'
);

select lives_ok(
  $$select public.replace_staff_services(
    'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'd2000000-0000-0000-0000-000000000001',
    array['d4000000-0000-0000-0000-000000000001'::uuid]
  )$$,
  'owner can atomically assign services to staff'
);

select results_eq(
  $$select weekday from public.staff_working_hours order by weekday$$,
  array[1::smallint],
  'owner reads their tenant working hours'
);

select results_eq(
  $$update public.staff_working_hours
    set weekday = 2
    where id = 'd3000000-0000-0000-0000-000000000001'
    returning weekday$$,
  array[2::smallint],
  'owner can update their tenant working hours'
);

select throws_ok(
  $$update public.staff_working_hours
    set business_id = 'dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = 'd3000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'owner cannot move working hours to another tenant'
);

select throws_ok(
  $$insert into public.staff_working_hours (
      business_id, branch_id, staff_id, weekday, starts_at, ends_at
    ) values (
      'dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'd1000000-0000-0000-0000-000000000002',
      'd2000000-0000-0000-0000-000000000002',
      1,
      '09:00',
      '18:00'
    )$$,
  '42501',
  null,
  'owner cannot create working hours in another tenant'
);

set local request.jwt.claim.sub = '43333333-3333-3333-3333-333333333333';

select throws_ok(
  $$select public.replace_staff_services(
    'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'd2000000-0000-0000-0000-000000000001',
    array[]::uuid[]
  )$$,
  '42501',
  null,
  'staff without permission receives an explicit error for an empty assignment'
);

select results_eq(
  $$select weekday from public.staff_working_hours$$,
  array[2::smallint],
  'staff member can read their tenant working hours'
);

select throws_ok(
  $$insert into public.staff_working_hours (
      business_id, branch_id, staff_id, weekday, starts_at, ends_at
    ) values (
      'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'd1000000-0000-0000-0000-000000000001',
      'd2000000-0000-0000-0000-000000000001',
      3,
      '09:00',
      '18:00'
    )$$,
  '42501',
  null,
  'staff without permission cannot create working hours'
);

select is_empty(
  $$delete from public.staff_working_hours
    where id = 'd3000000-0000-0000-0000-000000000001'
    returning id$$,
  'staff without permission cannot delete working hours'
);

set local request.jwt.claim.sub = '42222222-2222-2222-2222-222222222222';

select is_empty(
  $$select id from public.staff_working_hours$$,
  'second owner cannot read first tenant working hours'
);

select is_empty(
  $$delete from public.staff_working_hours
    where id = 'd3000000-0000-0000-0000-000000000001'
    returning id$$,
  'second owner cannot delete first tenant working hours'
);

set local request.jwt.claim.sub = '41111111-1111-1111-1111-111111111111';

select results_eq(
  $$delete from public.staff_working_hours
    where id = 'd3000000-0000-0000-0000-000000000001'
    returning id$$,
  array['d3000000-0000-0000-0000-000000000001'::uuid],
  'owner can delete their tenant working hours'
);

select * from finish();
rollback;
