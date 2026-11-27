begin;
select plan(12);

insert into auth.users (id, email)
values
  ('31111111-1111-1111-1111-111111111111', 'catalog-owner-a@example.test'),
  ('32222222-2222-2222-2222-222222222222', 'catalog-owner-b@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'catalog-staff@example.test');

set local request.jwt.claim.sub = '31111111-1111-1111-1111-111111111111';

insert into public.businesses (id, created_by, name, slug)
values (
  'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '31111111-1111-1111-1111-111111111111',
  'Catalog Tenant A',
  'catalog-tenant-a'
);

set local request.jwt.claim.sub = '32222222-2222-2222-2222-222222222222';

insert into public.businesses (id, created_by, name, slug)
values (
  'cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '32222222-2222-2222-2222-222222222222',
  'Catalog Tenant B',
  'catalog-tenant-b'
);

insert into public.business_members (business_id, user_id, role)
values (
  'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  'staff'
);

set local role anon;

select is_empty(
  $$select id from public.branches$$,
  'anonymous users cannot read branches of unpublished businesses'
);

select throws_ok(
  $$insert into public.services (business_id, name, duration_minutes)
    values ('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Anonymous Service', 30)$$,
  '42501',
  null,
  'anonymous users hold no service insert grant'
);

set local role authenticated;
set local request.jwt.claim.sub = '31111111-1111-1111-1111-111111111111';

select lives_ok(
  $$insert into public.branches (id, business_id, name, slug)
    values (
      'c1000000-0000-0000-0000-000000000001',
      'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Owner Branch',
      'owner-branch'
    )$$,
  'owner can create a branch in their tenant'
);

select lives_ok(
  $$insert into public.services (id, business_id, name, duration_minutes, price)
    values (
      'c2000000-0000-0000-0000-000000000001',
      'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Owner Service',
      45,
      700
    )$$,
  'owner can create a service in their tenant'
);

select results_eq(
  $$select name from public.branches order by name$$,
  array['Owner Branch'],
  'owner reads their own branches'
);

select results_eq(
  $$update public.services
    set price = 750
    where id = 'c2000000-0000-0000-0000-000000000001'
    returning price::numeric$$,
  array[750::numeric],
  'owner can update their own service'
);

select throws_ok(
  $$update public.branches
    set business_id = 'cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = 'c1000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'owner cannot move a branch to another tenant'
);

select is_empty(
  $$select id from public.services
    where business_id = 'cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  'owner cannot read another tenant catalog'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select results_eq(
  $$select name from public.services order by name$$,
  array['Owner Service'],
  'staff member can read their tenant services'
);

select throws_ok(
  $$insert into public.services (business_id, name, duration_minutes)
    values ('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Unauthorized Service', 30)$$,
  '42501',
  null,
  'staff without permission cannot create services'
);

set local request.jwt.claim.sub = '32222222-2222-2222-2222-222222222222';

select is_empty(
  $$select id from public.branches
    where business_id = 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'second owner cannot read first tenant branches'
);

select is_empty(
  $$delete from public.services
    where id = 'c2000000-0000-0000-0000-000000000001'
    returning id$$,
  'second owner cannot delete first tenant services'
);

select * from finish();
rollback;
