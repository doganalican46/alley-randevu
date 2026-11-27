begin;
select plan(14);

select has_table('public', 'notification_templates', 'notification_templates table exists');
select has_table('public', 'notification_outbox', 'notification_outbox table exists');
select has_table('public', 'payments', 'payments table exists');
select has_table('public', 'reviews', 'reviews table exists');
select col_not_null('public', 'notification_templates', 'business_id', 'notification templates are tenant scoped');
select col_not_null('public', 'notification_outbox', 'business_id', 'notification outbox is tenant scoped');
select col_not_null('public', 'payments', 'business_id', 'payments are tenant scoped');
select col_not_null('public', 'reviews', 'business_id', 'reviews are tenant scoped');
select ok(not has_table_privilege('anon', 'public.notification_templates', 'select,insert,update,delete'));
select ok(not has_table_privilege('anon', 'public.notification_outbox', 'select,insert,update,delete'));
select ok(not has_table_privilege('anon', 'public.payments', 'select,insert,update,delete'));
select ok(not has_table_privilege('authenticated', 'public.notification_outbox', 'insert,update,delete'));
select ok(has_table_privilege('anon', 'public.reviews', 'select'));
select ok(has_function_privilege('authenticated', 'public.get_business_report(uuid,timestamp with time zone,timestamp with time zone)', 'execute'));

select * from finish();
rollback;
