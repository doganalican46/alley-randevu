-- Transactional onboarding entry point. SECURITY INVOKER preserves RLS and
-- executes the business + primary branch writes atomically.

create or replace function public.create_business(
  business_name text,
  business_slug text,
  branch_name text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_business_id uuid;
  normalized_name text := trim(business_name);
  normalized_slug text := lower(trim(business_slug));
  normalized_branch_name text := trim(branch_name);
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if char_length(normalized_name) not between 2 and 120 then
    raise exception 'Business name must be between 2 and 120 characters'
      using errcode = '22023';
  end if;

  if normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(normalized_slug) not between 3 and 80 then
    raise exception 'Invalid business slug' using errcode = '22023';
  end if;

  if char_length(normalized_branch_name) not between 2 and 120 then
    raise exception 'Branch name must be between 2 and 120 characters'
      using errcode = '22023';
  end if;

  insert into public.businesses (created_by, name, slug)
  values ((select auth.uid()), normalized_name, normalized_slug)
  returning id into created_business_id;

  insert into public.branches (
    business_id,
    name,
    slug,
    is_primary
  )
  values (
    created_business_id,
    normalized_branch_name,
    'merkez',
    true
  );

  return created_business_id;
end;
$$;

revoke all on function public.create_business(text, text, text) from public, anon;
grant execute on function public.create_business(text, text, text) to authenticated;
