create index platform_admins_granted_by_idx
  on public.platform_admins(granted_by)
  where granted_by is not null;
create index business_subscriptions_updated_by_idx
  on public.business_subscriptions(updated_by)
  where updated_by is not null;
create index business_feature_flags_updated_by_idx
  on public.business_feature_flags(updated_by)
  where updated_by is not null;
create index business_customers_auth_user_lookup_idx
  on public.business_customers(auth_user_id)
  where auth_user_id is not null;
create index customer_notes_author_idx
  on public.customer_notes(author_user_id);
