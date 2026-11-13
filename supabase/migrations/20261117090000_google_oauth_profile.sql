-- Allow Google (and other OAuth) sign-ups to create a profile without the
-- custom consent metadata that email registration always sends.
-- Email sign-ups still require consent: true in raw_user_meta_data.
-- Also map Google's "name" / "full_name" into profiles.full_name.

create or replace function private.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  app  jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  yr   smallint;
  provider text := coalesce(app->>'provider', '');
  is_oauth boolean := provider <> '' and provider is distinct from 'email';
  full_name text;
begin
  -- Email registration path still requires explicit consent.
  if not is_oauth and (meta->>'consent') is distinct from 'true' then
    raise exception 'consent_required';
  end if;

  if (meta->>'year_of_study') ~ '^[1-8]$' then
    yr := (meta->>'year_of_study')::smallint;
  end if;

  -- Google / OAuth often send "full_name" or "name"; email path sends "full_name".
  full_name := btrim(coalesce(
    nullif(meta->>'full_name', ''),
    nullif(meta->>'name', ''),
    ''
  ));

  insert into public.profiles (
    id,
    full_name,
    email,
    programme,
    year_of_study,
    consent_given_at,
    privacy_notice_version
  )
  values (
    new.id,
    full_name,
    new.email,
    nullif(btrim(coalesce(meta->>'programme', '')), ''),
    yr,
    case when is_oauth or (meta->>'consent') = 'true' then now() else null end,
    nullif(meta->>'privacy_notice_version', '')
  );

  return new;
end;
$$;
