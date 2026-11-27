begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner-a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'owner-b@example.test');

insert into public.businesses (id, created_by, name, slug)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Tenant A',
    'tenant-a'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Tenant B',
    'tenant-b'
  );

set local role anon;

select is_empty(
  $$select id from public.businesses$$,
  'anonymous users cannot read unpublished businesses'
);

select throws_ok(
  $$insert into public.businesses (created_by, name, slug)
    values (
      '11111111-1111-1111-1111-111111111111',
      'Anonymous Tenant',
      'anonymous-tenant'
    )$$,
  '42501',
  null,
  'anonymous users cannot create businesses'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select name from public.businesses order by name$$,
  array['Tenant A'],
  'an owner reads only their own tenant'
);

select results_eq(
  $$update public.businesses
    set name = 'Tenant A Updated'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning name$$,
  array['Tenant A Updated'],
  'an owner can update their own tenant'
);

select is_empty(
  $$update public.businesses
    set name = 'Tenant B Stolen'
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    returning id$$,
  'an owner cannot update another tenant'
);

select throws_ok(
  $$delete from public.businesses
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '42501',
  null,
  'client roles cannot delete a business'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select results_eq(
  $$select name from public.businesses order by name$$,
  array['Tenant B'],
  'the second owner reads only the second tenant'
);

select is_empty(
  $$select id from public.businesses
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'cross-tenant reads are denied'
);

select * from finish();
rollback;
