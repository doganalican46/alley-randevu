begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

select has_table('public', 'businesses', 'businesses table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.businesses'::regclass),
  'businesses has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.business_members'::regclass),
  'business_members has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.branches'::regclass),
  'branches has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.services'::regclass),
  'services has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.staff_profiles'::regclass),
  'staff_profiles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.staff_services'::regclass),
  'staff_services has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.appointments'::regclass),
  'appointments has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.appointment_services'::regclass),
  'appointment_services has RLS enabled'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_staff_no_overlap'
  ),
  'appointments enforce staff overlap protection'
);

select function_returns(
  'public',
  'create_business',
  array['text', 'text', 'text'],
  'uuid',
  'create_business returns the new business id'
);

select isnt(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.create_business(text,text,text)'::regprocedure
  ),
  true,
  'create_business runs as security invoker'
);

select * from finish();
rollback;
