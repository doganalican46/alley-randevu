-- Platform administration is authorization data, never user-editable metadata.

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled'
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name text not null check (char_length(name) between 2 and 80),
  monthly_price numeric(12, 2) not null default 0 check (monthly_price >= 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_subscriptions (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+$'),
  label text not null check (char_length(label) between 2 and 100),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_feature_flags (
  business_id uuid not null references public.businesses(id) on delete cascade,
  feature_flag_id uuid not null references public.feature_flags(id) on delete cascade,
  enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (business_id, feature_flag_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 3 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index business_subscriptions_plan_idx
  on public.business_subscriptions(plan_id, status);
create index business_feature_flags_flag_idx
  on public.business_feature_flags(feature_flag_id, business_id);
create index audit_logs_business_created_idx
  on public.audit_logs(business_id, created_at desc);
create index audit_logs_actor_idx
  on public.audit_logs(actor_user_id, created_at desc)
  where actor_user_id is not null;

create trigger subscription_plans_set_updated_at before update on public.subscription_plans
for each row execute function private.set_updated_at();
create trigger business_subscriptions_set_updated_at before update on public.business_subscriptions
for each row execute function private.set_updated_at();
create trigger feature_flags_set_updated_at before update on public.feature_flags
for each row execute function private.set_updated_at();
create trigger business_feature_flags_set_updated_at before update on public.business_feature_flags
for each row execute function private.set_updated_at();

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.platform_admins administrator
      where administrator.user_id = (select auth.uid())
    );
$$;

create or replace function private.audit_business_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if row(old.name, old.status, old.is_published, old.timezone, old.currency)
    is distinct from
    row(new.name, new.status, new.is_published, new.timezone, new.currency) then
    insert into public.audit_logs (
      business_id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) values (
      new.id,
      (select auth.uid()),
      'business.updated',
      'business',
      new.id::text,
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'old_published', old.is_published,
        'new_published', new.is_published
      )
    );
  end if;
  return new;
end;
$$;

create trigger audit_business_change
after update on public.businesses
for each row execute function private.audit_business_change();

revoke all on function private.is_platform_admin() from public, anon, authenticated;
grant execute on function private.is_platform_admin() to authenticated;
revoke all on function private.audit_business_change() from public, anon, authenticated;

alter table public.platform_admins enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.business_subscriptions enable row level security;
alter table public.feature_flags enable row level security;
alter table public.business_feature_flags enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.platform_admins from anon, authenticated;
revoke all on table public.subscription_plans from anon, authenticated;
revoke all on table public.business_subscriptions from anon, authenticated;
revoke all on table public.feature_flags from anon, authenticated;
revoke all on table public.business_feature_flags from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on sequence public.audit_logs_id_seq from anon, authenticated;

grant select on table public.platform_admins to authenticated;
grant select, insert, update, delete on table public.subscription_plans to authenticated;
grant select, insert, update, delete on table public.business_subscriptions to authenticated;
grant select, insert, update, delete on table public.feature_flags to authenticated;
grant select, insert, update, delete on table public.business_feature_flags to authenticated;
grant select on table public.audit_logs to authenticated;

create policy platform_admins_read
on public.platform_admins for select to authenticated
using (private.is_platform_admin());

create policy subscription_plans_read
on public.subscription_plans for select to authenticated
using (is_active or private.is_platform_admin());
create policy subscription_plans_insert_admin
on public.subscription_plans for insert to authenticated
with check (private.is_platform_admin());
create policy subscription_plans_update_admin
on public.subscription_plans for update to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());
create policy subscription_plans_delete_admin
on public.subscription_plans for delete to authenticated
using (private.is_platform_admin());

create policy business_subscriptions_read
on public.business_subscriptions for select to authenticated
using (
  private.is_platform_admin()
  or private.has_business_permission(business_id, 'billing.manage')
);
create policy business_subscriptions_insert_admin
on public.business_subscriptions for insert to authenticated
with check (private.is_platform_admin());
create policy business_subscriptions_update_admin
on public.business_subscriptions for update to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());
create policy business_subscriptions_delete_admin
on public.business_subscriptions for delete to authenticated
using (private.is_platform_admin());

create policy feature_flags_read
on public.feature_flags for select to authenticated
using (is_active or private.is_platform_admin());
create policy feature_flags_insert_admin
on public.feature_flags for insert to authenticated
with check (private.is_platform_admin());
create policy feature_flags_update_admin
on public.feature_flags for update to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());
create policy feature_flags_delete_admin
on public.feature_flags for delete to authenticated
using (private.is_platform_admin());

create policy business_feature_flags_read
on public.business_feature_flags for select to authenticated
using (
  private.is_platform_admin()
  or private.is_business_member(business_id)
);
create policy business_feature_flags_insert_admin
on public.business_feature_flags for insert to authenticated
with check (private.is_platform_admin());
create policy business_feature_flags_update_admin
on public.business_feature_flags for update to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());
create policy business_feature_flags_delete_admin
on public.business_feature_flags for delete to authenticated
using (private.is_platform_admin());

create policy audit_logs_read
on public.audit_logs for select to authenticated
using (
  private.is_platform_admin()
  or private.has_business_permission(business_id, 'reports.view')
);

drop policy businesses_authenticated_read on public.businesses;
create policy businesses_authenticated_read
on public.businesses for select to authenticated
using (
  (is_published and status = 'active')
  or private.is_business_member(id)
  or private.is_platform_admin()
);

drop policy businesses_update_authorized on public.businesses;
create policy businesses_update_authorized
on public.businesses for update to authenticated
using (
  private.has_business_permission(id, 'settings.manage')
  or private.is_platform_admin()
)
with check (
  private.has_business_permission(id, 'settings.manage')
  or private.is_platform_admin()
);

insert into public.subscription_plans (code, name, monthly_price, currency, limits)
values
  ('starter', 'Başlangıç', 0, 'TRY', '{"branches": 1, "staff": 3}'::jsonb),
  ('growth', 'Büyüme', 799, 'TRY', '{"branches": 5, "staff": 25}'::jsonb),
  ('scale', 'Ölçek', 1999, 'TRY', '{"branches": 50, "staff": 250}'::jsonb);

insert into public.feature_flags (key, label, description)
values
  ('advanced_reports', 'Gelişmiş raporlar', 'Finansal ve operasyonel gelişmiş raporlar.'),
  ('automated_notifications', 'Otomatik bildirimler', 'Randevu hatırlatma ve durum bildirimleri.'),
  ('customer_crm', 'Müşteri CRM', 'Müşteri profilleri, etiketler ve notlar.');
