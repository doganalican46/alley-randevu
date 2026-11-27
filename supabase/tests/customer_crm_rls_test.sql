begin;
select plan(8);

select has_table('public', 'business_customers', 'business_customers table exists');
select has_table('public', 'customer_notes', 'customer_notes table exists');
select col_not_null('public', 'business_customers', 'business_id', 'CRM customers are tenant scoped');
select col_not_null('public', 'customer_notes', 'business_id', 'customer notes are tenant scoped');
select ok(
  not has_table_privilege('anon', 'public.business_customers', 'select,insert,update,delete'),
  'anonymous users cannot access CRM customers'
);
select ok(
  not has_table_privilege('anon', 'public.customer_notes', 'select,insert,update,delete'),
  'anonymous users cannot access customer notes'
);
select ok(
  has_table_privilege('authenticated', 'public.business_customers', 'select,insert,update,delete'),
  'authenticated role receives explicit CRM grants constrained by RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.customer_notes', 'select,insert,update,delete'),
  'authenticated role receives explicit note grants constrained by RLS'
);

select * from finish();
rollback;
