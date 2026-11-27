-- A tenant owner may publish/unpublish an active or draft business, but cannot
-- override a platform suspension or archive through a direct Data API update.

create or replace function private.protect_platform_business_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status in ('suspended', 'archived')
    and new.status is distinct from old.status
    and not private.is_platform_admin() then
    raise exception 'Only a platform administrator can change a suspended or archived business'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger protect_platform_business_status
before update of status on public.businesses
for each row execute function private.protect_platform_business_status();

revoke all on function private.protect_platform_business_status() from public, anon, authenticated;
