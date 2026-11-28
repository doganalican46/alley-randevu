-- INSERT ... RETURNING also evaluates SELECT policies. During onboarding the
-- owner membership is added by the AFTER INSERT trigger, so the new row must
-- be readable by its creator before that trigger has completed.
drop policy businesses_authenticated_read on public.businesses;

create policy businesses_authenticated_read
on public.businesses for select to authenticated
using (
  created_by = (select auth.uid())
  or (is_published and status = 'active')
  or private.is_business_member(id)
  or private.is_platform_admin()
);
