begin;
select plan(9);

insert into auth.users (id, email)
values
  ('51111111-1111-1111-1111-111111111111', 'public-owner-a@example.test'),
  ('52222222-2222-2222-2222-222222222222', 'public-owner-b@example.test');

set local request.jwt.claim.sub = '51111111-1111-1111-1111-111111111111';

insert into public.businesses (id, created_by, name, slug, status, is_published)
values (
  'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '51111111-1111-1111-1111-111111111111',
  'Public Tenant A',
  'public-tenant-a',
  'active',
  true
);

set local request.jwt.claim.sub = '52222222-2222-2222-2222-222222222222';

insert into public.businesses (id, created_by, name, slug, status, is_published)
values (
  'ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '52222222-2222-2222-2222-222222222222',
  'Private Tenant B',
  'private-tenant-b',
  'draft',
  false
);

insert into public.branches (id, business_id, name, slug, is_active)
values
  (
    'e1000000-0000-0000-0000-000000000001',
    'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Public Branch',
    'public-branch',
    true
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Inactive Branch',
    'inactive-branch',
    false
  ),
  (
    'e1000000-0000-0000-0000-000000000003',
    'ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Private Branch',
    'private-branch',
    true
  );

insert into public.services (id, business_id, name, duration_minutes, is_active)
values
  (
    'e2000000-0000-0000-0000-000000000001',
    'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Public Service',
    30,
    true
  ),
  (
    'e2000000-0000-0000-0000-000000000002',
    'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Inactive Service',
    45,
    false
  ),
  (
    'e2000000-0000-0000-0000-000000000003',
    'ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Private Service',
    60,
    true
  );

select ok(has_table_privilege('anon', 'public.businesses', 'select'), 'anon can select businesses');
select ok(has_table_privilege('anon', 'public.branches', 'select'), 'anon can select branches');
select ok(has_table_privilege('anon', 'public.services', 'select'), 'anon can select services');
select ok(
  not has_table_privilege('anon', 'public.branches', 'insert,update,delete'),
  'anon holds no branch write privileges'
);
select ok(
  not has_table_privilege('anon', 'public.services', 'insert,update,delete'),
  'anon holds no service write privileges'
);

set local role anon;

select results_eq(
  $$select name from public.businesses order by name$$,
  array['Public Tenant A'],
  'anon reads only active published businesses'
);

select results_eq(
  $$select name from public.branches order by name$$,
  array['Public Branch'],
  'anon reads only active branches of published businesses'
);

select results_eq(
  $$select name from public.services order by name$$,
  array['Public Service'],
  'anon reads only active services of published businesses'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

select results_eq(
  $$select name from public.businesses order by name$$,
  array['Public Tenant A'],
  'non-member authenticated users see only the public catalog'
);

select * from finish();
rollback;
