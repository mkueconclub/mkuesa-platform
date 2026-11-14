-- The Treasurer confirms membership payments, so the Treasurer may now approve or reject applications,
-- alongside the Super Admin, Chairperson and Membership Coordinator.
create or replace function private.is_member_approver()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_any_role(array['super_admin','chairperson','treasurer','membership_coordinator']::public.user_role[])
$$;

-- An approver must be able to see who applied. These add to (never replace) the existing read policies,
-- so the Treasurer still cannot browse the wider member directory or analytics.
create policy memberships_select_approver on public.memberships for select to authenticated
  using (private.is_member_approver());
create policy profiles_select_approver on public.profiles for select to authenticated
  using (private.is_member_approver());
