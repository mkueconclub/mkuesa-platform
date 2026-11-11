-- TEST ONLY: assertion helpers. Each assertion prints PASS or raises FAIL.
create schema test;
grant usage on schema test to anon, authenticated;

create function test.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', msg; end if;
  raise notice 'PASS: %', msg;
end $$;

create function test.eq(actual bigint, expected bigint, msg text) returns void language plpgsql as $$
begin
  if actual is distinct from expected then raise exception 'FAIL: % (expected %, got %)', msg, expected, actual; end if;
  raise notice 'PASS: %', msg;
end $$;

-- Passes only if `sql` raises an error containing `pattern`.
create function test.throws(sql text, pattern text, msg text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlerrm ilike '%' || pattern || '%' then raise notice 'PASS: %', msg; return; end if;
    raise exception 'FAIL: % (wrong error: %)', msg, sqlerrm;
  end;
  raise exception 'FAIL: % (no error was raised)', msg;
end $$;

create function test.count(sql text) returns bigint language plpgsql as $$
declare n bigint; begin execute 'select count(*) from (' || sql || ') q' into n; return n; end $$;

-- Number of rows a write statement actually affected (RLS can silently hide rows).
create function test.rows(sql text) returns bigint language plpgsql as $$
declare n bigint; begin execute sql; get diagnostics n = row_count; return n; end $$;

create function test.as_user(uid uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid::text, true); perform set_config('role', 'authenticated', true); end $$;
create function test.as_anon() returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('role', 'anon', true); end $$;
create function test.as_admin() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

create function test.u(n text) returns uuid language sql immutable as $$
  select case n
    when 'super' then '00000000-0000-0000-0000-000000000001' when 'chair' then '00000000-0000-0000-0000-000000000002'
    when 'vice' then '00000000-0000-0000-0000-000000000003' when 'sec' then '00000000-0000-0000-0000-000000000004'
    when 'treas' then '00000000-0000-0000-0000-000000000005' when 'memco' then '00000000-0000-0000-0000-000000000006'
    when 'editor' then '00000000-0000-0000-0000-000000000007' when 'ma' then '00000000-0000-0000-0000-000000000008'
    when 'mb' then '00000000-0000-0000-0000-000000000009' when 'mc' then '00000000-0000-0000-0000-00000000000a' end::uuid
$$;
create function test.ev(n text) returns uuid language sql immutable as $$
  select case n
    when 'pub' then '10000000-0000-0000-0000-000000000001' when 'draft' then '10000000-0000-0000-0000-000000000002'
    when 'members' then '10000000-0000-0000-0000-000000000003' when 'open' then '10000000-0000-0000-0000-000000000004'
    when 'past' then '10000000-0000-0000-0000-000000000005' when 'deadline' then '10000000-0000-0000-0000-000000000006' end::uuid
$$;
