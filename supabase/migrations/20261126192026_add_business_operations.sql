create type public.notification_channel as enum ('email', 'sms', 'push');
create type public.notification_delivery_status as enum (
  'pending', 'processing', 'sent', 'failed', 'cancelled'
);
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'void');
create type public.payment_method as enum ('cash', 'card', 'bank_transfer', 'other');

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_key text not null check (event_key ~ '^[a-z0-9_]+$'),
  channel public.notification_channel not null,
  subject text,
  body text not null check (char_length(body) between 2 and 4000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, event_key, channel)
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  appointment_id uuid,
  event_key text not null check (event_key ~ '^[a-z0-9_]+$'),
  channel public.notification_channel not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status public.notification_delivery_status not null default 'pending',
  attempts integer not null default 0 check (attempts between 0 and 100),
  next_attempt_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  foreign key (business_id, appointment_id)
    references public.appointments(business_id, id) on delete cascade,
  unique (appointment_id, event_key, channel)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  appointment_id uuid,
  customer_id uuid,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  method public.payment_method not null,
  status public.payment_status not null default 'paid',
  external_reference text,
  paid_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, appointment_id)
    references public.appointments(business_id, id) on delete restrict,
  foreign key (business_id, customer_id)
    references public.business_customers(business_id, id) on delete restrict
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  appointment_id uuid not null unique,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) between 2 and 2000),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, appointment_id)
    references public.appointments(business_id, id) on delete restrict
);

create index notification_templates_business_idx
  on public.notification_templates(business_id, event_key);
create index notification_outbox_pending_idx
  on public.notification_outbox(status, next_attempt_at)
  where status in ('pending', 'failed');
create index notification_outbox_business_idx
  on public.notification_outbox(business_id, created_at desc);
create index payments_business_paid_idx
  on public.payments(business_id, paid_at desc);
create index payments_appointment_idx
  on public.payments(appointment_id)
  where appointment_id is not null;
create index payments_customer_idx
  on public.payments(customer_id)
  where customer_id is not null;
create index payments_created_by_idx on public.payments(created_by);
create index reviews_business_idx
  on public.reviews(business_id, created_at desc)
  where is_published;
create index reviews_customer_idx on public.reviews(customer_user_id);

create trigger notification_templates_set_updated_at before update on public.notification_templates
for each row execute function private.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
for each row execute function private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function private.set_updated_at();

create or replace function private.enqueue_appointment_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_channel public.notification_channel;
  selected_recipient text;
  selected_event text;
begin
  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  selected_channel := case
    when nullif(trim(new.customer_email_snapshot), '') is not null then 'email'::public.notification_channel
    when nullif(trim(new.customer_phone_snapshot), '') is not null then 'sms'::public.notification_channel
    else null
  end;
  selected_recipient := case selected_channel
    when 'email' then new.customer_email_snapshot
    when 'sms' then new.customer_phone_snapshot
    else null
  end;

  if selected_channel is null or selected_recipient is null then
    return new;
  end if;

  selected_event := case
    when tg_op = 'INSERT' then 'appointment_created'
    else 'appointment_' || lower(new.status::text)
  end;

  insert into public.notification_outbox (
    business_id,
    appointment_id,
    event_key,
    channel,
    recipient,
    payload
  ) values (
    new.business_id,
    new.id,
    selected_event,
    selected_channel,
    selected_recipient,
    jsonb_build_object(
      'appointment_id', new.id,
      'customer_name', new.customer_name_snapshot,
      'starts_at', new.starts_at,
      'status', new.status
    )
  )
  on conflict (appointment_id, event_key, channel) do nothing;

  return new;
end;
$$;

create trigger enqueue_appointment_notification
after insert or update of status on public.appointments
for each row execute function private.enqueue_appointment_notification();

create or replace function private.protect_review_content()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if row(old.business_id, old.appointment_id, old.customer_user_id, old.rating, old.comment)
    is distinct from
    row(new.business_id, new.appointment_id, new.customer_user_id, new.rating, new.comment) then
    raise exception 'Only review publication state can be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_review_content
before update on public.reviews
for each row execute function private.protect_review_content();

create or replace function public.get_business_report(
  target_business_id uuid,
  target_from timestamptz,
  target_to timestamptz
)
returns table (
  appointment_count bigint,
  completed_count bigint,
  appointment_revenue numeric,
  collected_amount numeric,
  average_rating numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(appointment.id),
    count(appointment.id) filter (where appointment.status = 'COMPLETED'),
    coalesce(sum(appointment.total_amount) filter (where appointment.status = 'COMPLETED'), 0),
    coalesce((
      select sum(payment.amount)
      from public.payments payment
      where payment.business_id = target_business_id
        and payment.status = 'paid'
        and payment.paid_at >= target_from
        and payment.paid_at < target_to
    ), 0),
    (select round(avg(review.rating), 2) from public.reviews review where review.business_id = target_business_id)
  from public.appointments appointment
  where appointment.business_id = target_business_id
    and appointment.starts_at >= target_from
    and appointment.starts_at < target_to;
$$;

revoke all on function private.enqueue_appointment_notification() from public, anon, authenticated;
revoke all on function private.protect_review_content() from public, anon, authenticated;
revoke all on function public.get_business_report(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_business_report(uuid, timestamptz, timestamptz) to authenticated;

alter table public.notification_templates enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

revoke all on table public.notification_templates from anon, authenticated;
revoke all on table public.notification_outbox from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.reviews from anon, authenticated;

grant select, insert, update, delete on table public.notification_templates to authenticated;
grant select on table public.notification_outbox to authenticated;
grant select, insert, update on table public.payments to authenticated;
grant select on table public.reviews to anon;
grant select, insert, update on table public.reviews to authenticated;

create policy notification_templates_read
on public.notification_templates for select to authenticated
using (private.has_business_permission(business_id, 'settings.manage'));
create policy notification_templates_insert
on public.notification_templates for insert to authenticated
with check (private.has_business_permission(business_id, 'settings.manage'));
create policy notification_templates_update
on public.notification_templates for update to authenticated
using (private.has_business_permission(business_id, 'settings.manage'))
with check (private.has_business_permission(business_id, 'settings.manage'));
create policy notification_templates_delete
on public.notification_templates for delete to authenticated
using (private.has_business_permission(business_id, 'settings.manage'));

create policy notification_outbox_read
on public.notification_outbox for select to authenticated
using (private.has_business_permission(business_id, 'settings.manage'));

create policy payments_read
on public.payments for select to authenticated
using (private.has_business_permission(business_id, 'reports.financial'));
create policy payments_insert
on public.payments for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_business_permission(business_id, 'billing.manage')
);
create policy payments_update
on public.payments for update to authenticated
using (private.has_business_permission(business_id, 'billing.manage'))
with check (private.has_business_permission(business_id, 'billing.manage'));

create policy reviews_public_read
on public.reviews for select to anon
using (
  is_published
  and exists (
    select 1 from public.businesses business
    where business.id = reviews.business_id
      and business.status = 'active'
      and business.is_published
  )
);
create policy reviews_authenticated_read
on public.reviews for select to authenticated
using (
  customer_user_id = (select auth.uid())
  or private.is_business_member(business_id)
  or (
    is_published
    and exists (
      select 1 from public.businesses business
      where business.id = reviews.business_id
        and business.status = 'active'
        and business.is_published
    )
  )
);
create policy reviews_insert_customer
on public.reviews for insert to authenticated
with check (
  customer_user_id = (select auth.uid())
  and exists (
    select 1 from public.appointments appointment
    where appointment.id = reviews.appointment_id
      and appointment.business_id = reviews.business_id
      and appointment.customer_id = (select auth.uid())
      and appointment.status = 'COMPLETED'
  )
);
create policy reviews_update_publication
on public.reviews for update to authenticated
using (private.has_business_permission(business_id, 'settings.manage'))
with check (private.has_business_permission(business_id, 'settings.manage'));
