begin;
select plan(7);

insert into auth.users (id, email)
values
  ('51111111-1111-1111-1111-111111111111', 'onboarding-owner@example.test'),
  ('52222222-2222-2222-2222-222222222222', 'onboarding-other@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '51111111-1111-1111-1111-111111111111';

select lives_ok(
  $$select public.create_business('Onboarding Tenant', 'onboarding-tenant', 'Merkez Şube')$$,
  'an authenticated user can create a complete business workspace'
);

select results_eq(
  $$select created_by from public.businesses where slug = 'onboarding-tenant'$$,
  array['51111111-1111-1111-1111-111111111111'::uuid],
  'the workspace belongs to the authenticated creator'
);

select results_eq(
  $$select role::text from public.business_members where user_id = '51111111-1111-1111-1111-111111111111'$$,
  array['owner'],
  'the creator becomes the owner'
);

select results_eq(
  $$select name from public.branches where business_id = (select id from public.businesses where slug = 'onboarding-tenant')$$,
  array['Merkez Şube'],
  'the primary branch is created atomically'
);

select throws_ok(
  $$select public.create_business('Duplicate Tenant', 'onboarding-tenant', 'Merkez')$$,
  '23505',
  null,
  'duplicate booking links are rejected'
);

set local request.jwt.claim.sub = '52222222-2222-2222-2222-222222222222';

select is_empty(
  $$select id from public.businesses where slug = 'onboarding-tenant'$$,
  'another tenant cannot read the new workspace'
);

set local role anon;

select throws_ok(
  $$select public.create_business('Anonymous Tenant', 'anonymous-tenant', 'Merkez')$$,
  '42501',
  null,
  'anonymous users cannot execute the onboarding function'
);

select * from finish();
rollback;
