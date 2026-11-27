begin;
select plan(18);

select has_table('public', 'customer_loyalty_accounts');
select has_table('public', 'customer_loyalty_transactions');
select has_table('public', 'campaigns');
select col_not_null('public', 'customer_loyalty_accounts', 'business_id');
select col_not_null('public', 'customer_loyalty_transactions', 'business_id');
select col_not_null('public', 'campaigns', 'business_id');
select ok(not has_table_privilege('anon', 'public.customer_loyalty_accounts', 'select,insert,update,delete'));
select ok(not has_table_privilege('anon', 'public.customer_loyalty_transactions', 'select,insert,update,delete'));
select ok(not has_table_privilege('anon', 'public.campaigns', 'select,insert,update,delete'));
select ok(has_table_privilege('authenticated', 'public.customer_loyalty_accounts', 'select'));
select ok(not has_table_privilege('authenticated', 'public.customer_loyalty_accounts', 'insert,update,delete'));
select ok(has_table_privilege('authenticated', 'public.customer_loyalty_transactions', 'select'));
select ok(not has_table_privilege('authenticated', 'public.customer_loyalty_transactions', 'insert,update,delete'));
select ok(has_table_privilege('authenticated', 'public.campaigns', 'select,insert'));
select ok(not has_table_privilege('authenticated', 'public.campaigns', 'update,delete'));
select ok(has_function_privilege('authenticated', 'public.adjust_customer_loyalty(uuid,uuid,integer,text)', 'execute'));
select ok(has_function_privilege('authenticated', 'public.queue_campaign(uuid)', 'execute'));
select ok(not has_function_privilege('anon', 'public.queue_campaign(uuid)', 'execute'));

select * from finish();
rollback;
