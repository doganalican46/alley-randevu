-- Tenant-isolated CRM foundation for business operations.

create table public.business_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text,
  phone text,
  notes text,
  tags text[] not null default '{}',
  appointment_count integer not null default 0 check (appointment_count >= 0),
  last_appointment_at timestamptz,
  marketing_consent boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id)
);

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 2 and 2000),
  created_at timestamptz not null default now(),
  foreign key (business_id, customer_id)
    references public.business_customers(business_id, id) on delete cascade
);

create unique index business_customers_auth_user_idx
  on public.business_customers(business_id, auth_user_id)
  where auth_user_id is not null;
create index business_customers_name_idx
  on public.business_customers(business_id, full_name);
create index business_customers_last_appointment_idx
  on public.business_customers(business_id, last_appointment_at desc);
create index customer_notes_customer_idx
  on public.customer_notes(business_id, customer_id, created_at desc);

create trigger business_customers_set_updated_at before update on public.business_customers
for each row execute function private.set_updated_at();

create or replace function private.sync_appointment_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.customer_id is null then
    return new;
  end if;

  insert into public.business_customers (
    business_id,
    auth_user_id,
    full_name,
    email,
    phone,
    appointment_count,
    last_appointment_at
  ) values (
    new.business_id,
    new.customer_id,
    new.customer_name_snapshot,
    new.customer_email_snapshot,
    new.customer_phone_snapshot,
    1,
    new.starts_at
  )
  on conflict (business_id, auth_user_id) where auth_user_id is not null
  do update set
    full_name = excluded.full_name,
    email = coalesce(excluded.email, public.business_customers.email),
    phone = coalesce(excluded.phone, public.business_customers.phone),
    appointment_count = public.business_customers.appointment_count + 1,
    last_appointment_at = greatest(
      public.business_customers.last_appointment_at,
      excluded.last_appointment_at
    );

  return new;
end;
$$;

create trigger sync_appointment_customer
after insert on public.appointments
for each row execute function private.sync_appointment_customer();

revoke all on function private.sync_appointment_customer() from public, anon, authenticated;

alter table public.business_customers enable row level security;
alter table public.customer_notes enable row level security;

revoke all on table public.business_customers from anon, authenticated;
revoke all on table public.customer_notes from anon, authenticated;
grant select, insert, update, delete on table public.business_customers to authenticated;
grant select, insert, update, delete on table public.customer_notes to authenticated;

create policy business_customers_read
on public.business_customers for select to authenticated
using (private.has_business_permission(business_id, 'customers.read'));
create policy business_customers_insert
on public.business_customers for insert to authenticated
with check (private.has_business_permission(business_id, 'customers.manage'));
create policy business_customers_update
on public.business_customers for update to authenticated
using (private.has_business_permission(business_id, 'customers.manage'))
with check (private.has_business_permission(business_id, 'customers.manage'));
create policy business_customers_delete
on public.business_customers for delete to authenticated
using (private.has_business_permission(business_id, 'customers.manage'));

create policy customer_notes_read
on public.customer_notes for select to authenticated
using (private.has_business_permission(business_id, 'customers.read'));
create policy customer_notes_insert
on public.customer_notes for insert to authenticated
with check (
  author_user_id = (select auth.uid())
  and private.has_business_permission(business_id, 'customers.manage')
);
create policy customer_notes_update
on public.customer_notes for update to authenticated
using (
  author_user_id = (select auth.uid())
  and private.has_business_permission(business_id, 'customers.manage')
)
with check (
  author_user_id = (select auth.uid())
  and private.has_business_permission(business_id, 'customers.manage')
);
create policy customer_notes_delete
on public.customer_notes for delete to authenticated
using (
  author_user_id = (select auth.uid())
  and private.has_business_permission(business_id, 'customers.manage')
);
