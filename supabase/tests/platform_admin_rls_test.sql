begin;
select plan(12);

select has_table('public', 'platform_admins');
select has_table('public', 'subscription_plans');
select has_table('public', 'business_subscriptions');
select has_table('public', 'feature_flags');
select has_table('public', 'business_feature_flags');
select has_table('public', 'audit_logs');

select ok(
  not has_table_privilege('anon', 'public.platform_admins', 'select,insert,update,delete'),
  'anonymous users cannot access platform administrators'
);
select ok(
  not has_table_privilege('anon', 'public.business_subscriptions', 'select,insert,update,delete'),
  'anonymous users cannot access subscriptions'
);
select ok(
  not has_table_privilege('authenticated', 'public.platform_admins', 'insert,update,delete'),
  'clients cannot bootstrap platform administrators'
);
select ok(
  has_table_privilege('authenticated', 'public.subscription_plans', 'select'),
  'authenticated users can read plans through RLS'
);
select ok(
  not has_function_privilege('anon', 'private.is_platform_admin()', 'execute'),
  'anonymous users cannot execute the platform authorization helper'
);
select ok(
  has_function_privilege('authenticated', 'private.is_platform_admin()', 'execute'),
  'authenticated users can evaluate platform authorization through RLS'
);

select * from finish();
rollback;
