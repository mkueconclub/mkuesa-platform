-- Master Admin access.
-- The Super Administrator recruits members and appoints officers, so membership approval must never stand in
-- their way. Every member-only rule in the database (members-only announcements, events, resources, event
-- registration, research submission) goes through this one function, so changing it here changes all of them.
-- Other officers are NOT included: they keep needing an approved membership for member-only features.
create or replace function private.is_approved_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_any_role(array['super_admin']::public.user_role[])
    or exists (
      select 1 from public.memberships m
      where m.profile_id = (select auth.uid())
        and m.status = 'approved'
        and (m.expires_at is null or m.expires_at >= current_date)
    )
$$;
