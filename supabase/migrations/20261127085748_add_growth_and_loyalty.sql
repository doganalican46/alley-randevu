create table public.customer_loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_id),
  foreign key (business_id, customer_id)
    references public.business_customers(business_id, id) on delete cascade
);

create table public.customer_loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null,
  points_delta integer not null check (points_delta <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null check (char_length(reason) between 2 and 240),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (business_id, customer_id)
    references public.business_customers(business_id, id) on delete cascade
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  channel public.notification_channel not null check (channel in ('email', 'sms')),
  subject text check (subject is null or char_length(subject) between 2 and 200),
  body text not null check (char_length(body) between 2 and 4000),
  audience_tag text check (audience_tag is null or char_length(audience_tag) between 1 and 80),
  status text not null default 'draft' check (status in ('draft', 'queued')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  queued_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create index customer_loyalty_accounts_customer_idx
  on public.customer_loyalty_accounts(business_id, customer_id);
create index customer_loyalty_transactions_customer_idx
  on public.customer_loyalty_transactions(business_id, customer_id, created_at desc);
create index customer_loyalty_transactions_created_by_idx
  on public.customer_loyalty_transactions(created_by);
create index campaigns_business_created_idx
  on public.campaigns(business_id, created_at desc);
create index campaigns_created_by_idx on public.campaigns(created_by);

create trigger customer_loyalty_accounts_set_updated_at
before update on public.customer_loyalty_accounts
for each row execute function private.set_updated_at();

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function private.set_updated_at();

create function private.adjust_customer_loyalty(
  target_business_id uuid,
  target_customer_id uuid,
  target_points_delta integer,
  target_reason text
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_balance integer;
  next_balance integer;
begin
  if (select auth.uid()) is null
    or not private.has_business_permission(target_business_id, 'customers.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if target_points_delta = 0 or char_length(trim(target_reason)) < 2 then
    raise exception 'A non-zero point value and reason are required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.business_customers customer
    where customer.business_id = target_business_id
      and customer.id = target_customer_id
  ) then
    raise exception 'Customer not found' using errcode = 'P0002';
  end if;

  insert into public.customer_loyalty_accounts (business_id, customer_id)
  values (target_business_id, target_customer_id)
  on conflict (business_id, customer_id) do nothing;

  select account.points_balance
  into current_balance
  from public.customer_loyalty_accounts account
  where account.business_id = target_business_id
    and account.customer_id = target_customer_id
  for update;

  next_balance := current_balance + target_points_delta;
  if next_balance < 0 then
    raise exception 'Loyalty balance cannot be negative' using errcode = '23514';
  end if;

  update public.customer_loyalty_accounts
  set
    points_balance = next_balance,
    lifetime_earned = lifetime_earned + greatest(target_points_delta, 0)
  where business_id = target_business_id
    and customer_id = target_customer_id;

  insert into public.customer_loyalty_transactions (
    business_id,
    customer_id,
    points_delta,
    balance_after,
    reason,
    created_by
  ) values (
    target_business_id,
    target_customer_id,
    target_points_delta,
    next_balance,
    trim(target_reason),
    (select auth.uid())
  );

  return next_balance;
end;
$$;

create function private.queue_campaign(target_campaign_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  selected_campaign public.campaigns%rowtype;
  queued_recipients integer;
begin
  select campaign.*
  into selected_campaign
  from public.campaigns campaign
  where campaign.id = target_campaign_id
  for update;

  if not found then
    raise exception 'Campaign not found' using errcode = 'P0002';
  end if;

  if (select auth.uid()) is null
    or not private.has_business_permission(selected_campaign.business_id, 'customers.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if selected_campaign.status <> 'draft' then
    raise exception 'Only draft campaigns can be queued' using errcode = '22023';
  end if;

  insert into public.notification_outbox (
    business_id,
    event_key,
    channel,
    recipient,
    payload
  )
  select
    selected_campaign.business_id,
    'campaign_' || replace(selected_campaign.id::text, '-', ''),
    selected_campaign.channel,
    case selected_campaign.channel
      when 'email' then trim(customer.email)
      when 'sms' then trim(customer.phone)
      else null
    end,
    jsonb_build_object(
      'campaign_id', selected_campaign.id,
      'customer_id', customer.id,
      'customer_name', customer.full_name,
      'subject', selected_campaign.subject,
      'body', selected_campaign.body
    )
  from public.business_customers customer
  where customer.business_id = selected_campaign.business_id
    and customer.is_active
    and customer.marketing_consent
    and (
      selected_campaign.audience_tag is null
      or selected_campaign.audience_tag = any(customer.tags)
    )
    and (
      (selected_campaign.channel = 'email' and nullif(trim(customer.email), '') is not null)
      or (selected_campaign.channel = 'sms' and nullif(trim(customer.phone), '') is not null)
    );

  get diagnostics queued_recipients = row_count;

  update public.campaigns
  set
    status = 'queued',
    recipient_count = queued_recipients,
    queued_at = now()
  where id = selected_campaign.id;

  return queued_recipients;
end;
$$;

create function public.adjust_customer_loyalty(
  target_business_id uuid,
  target_customer_id uuid,
  target_points_delta integer,
  target_reason text
)
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.adjust_customer_loyalty(
    target_business_id,
    target_customer_id,
    target_points_delta,
    target_reason
  );
$$;

create function public.queue_campaign(target_campaign_id uuid)
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.queue_campaign(target_campaign_id);
$$;

revoke all on function private.adjust_customer_loyalty(uuid, uuid, integer, text)
  from public, anon, authenticated;
revoke all on function private.queue_campaign(uuid)
  from public, anon, authenticated;
grant execute on function private.adjust_customer_loyalty(uuid, uuid, integer, text)
  to authenticated;
grant execute on function private.queue_campaign(uuid)
  to authenticated;

revoke all on function public.adjust_customer_loyalty(uuid, uuid, integer, text)
  from public, anon, authenticated;
revoke all on function public.queue_campaign(uuid)
  from public, anon, authenticated;
grant execute on function public.adjust_customer_loyalty(uuid, uuid, integer, text)
  to authenticated;
grant execute on function public.queue_campaign(uuid)
  to authenticated;

alter table public.customer_loyalty_accounts enable row level security;
alter table public.customer_loyalty_transactions enable row level security;
alter table public.campaigns enable row level security;

revoke all on table public.customer_loyalty_accounts from anon, authenticated;
revoke all on table public.customer_loyalty_transactions from anon, authenticated;
revoke all on table public.campaigns from anon, authenticated;

grant select on table public.customer_loyalty_accounts to authenticated;
grant select on table public.customer_loyalty_transactions to authenticated;
grant select, insert on table public.campaigns to authenticated;

create policy customer_loyalty_accounts_read
on public.customer_loyalty_accounts for select to authenticated
using (private.has_business_permission(business_id, 'customers.read'));

create policy customer_loyalty_transactions_read
on public.customer_loyalty_transactions for select to authenticated
using (private.has_business_permission(business_id, 'customers.read'));

create policy campaigns_read
on public.campaigns for select to authenticated
using (private.has_business_permission(business_id, 'customers.read'));

create policy campaigns_insert
on public.campaigns for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_business_permission(business_id, 'customers.manage')
);
