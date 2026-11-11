-- Waiting-list promotion (Phase 4).
-- When a confirmed place is freed (a registration is cancelled or removed), the longest-waiting
-- person on the waiting list is moved up automatically. Runs inside the same transaction as the
-- cancellation, and locks the event row first so two cancellations cannot promote the same person.

create function private.promote_waitlist() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  ev uuid := case when tg_op = 'DELETE' then old.event_id else new.event_id end;
  cap integer;
  taken integer;
  next_id uuid;
begin
  -- Only a registration that actually held a place can free one.
  if tg_op = 'UPDATE' and not (old.status in ('registered', 'attended') and new.status = 'cancelled') then
    return null;
  end if;
  if tg_op = 'DELETE' and old.status not in ('registered', 'attended') then
    return null;
  end if;

  select e.capacity into cap from public.events e where e.id = ev for update;
  if cap is null then return null; end if; -- unlimited events have no waiting list

  loop
    select count(*) into taken from public.event_registrations r where r.event_id = ev and r.status in ('registered', 'attended');
    exit when taken >= cap;
    select r.id into next_id from public.event_registrations r where r.event_id = ev and r.status = 'waitlisted' order by r.registered_at, r.id limit 1;
    exit when next_id is null;
    update public.event_registrations set status = 'registered' where id = next_id;
  end loop;
  return null;
end $$;

-- Internal function: nobody calls it directly (guarded by supabase/tests/t01_structure.sql).
revoke all on function private.promote_waitlist() from public, anon, authenticated;

create trigger event_registrations_promote after update of status or delete on public.event_registrations
  for each row execute function private.promote_waitlist();
