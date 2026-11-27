begin;
select plan(14);

select has_table('public', 'notification_templates');
select has_table('public', 'notification_outbox');
select has_table('public', 'payments');
select has_table('public', 'reviews');
select col_not_null('public', 'notification_templates', 'business_id');
select col_not_null('public', 'notification_outbox', 'business_id');
select col_not_null('public', 'payments', 'business_id');
select col_not_null('public', 'reviews', 'business_id');
select ok(not has_table_privilege('anon', 'public.notification_templates', 'select,insert,update,delete'));
select ok(not has_table_privilege('anon', 'public.notification_outbox', 'select,insert,update,delete'));
select ok(not has_table_privilege('anon', 'public.payments', 'select,insert,update,delete'));
select ok(not has_table_privilege('authenticated', 'public.notification_outbox', 'insert,update,delete'));
select ok(has_table_privilege('anon', 'public.reviews', 'select'));
select ok(has_function_privilege('authenticated', 'public.get_business_report(uuid,timestamp with time zone,timestamp with time zone)', 'execute'));

select * from finish();
rollback;
