#!/usr/bin/env bash
# Applies every migration to a scratch PostgreSQL database and runs the permission tests.
# Usage: bash supabase/tests/run.sh      (needs a local PostgreSQL 15+ and a superuser)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK=$(mktemp -d); cp -r "$HERE/.." "$WORK/supabase"; chmod -R a+rX "$WORK"; chmod a+x "$WORK"
DB=mkuesa_test
run() { runuser -u postgres -- psql -X -q -v ON_ERROR_STOP=1 -d "$1" "${@:2}" 2>&1; }

pg_ctlcluster 16 main start 2>/dev/null || true; sleep 2
runuser -u postgres -- psql -X -q -c "drop database if exists $DB" -c "create database $DB" >/dev/null 2>&1
for r in anon authenticated service_role; do runuser -u postgres -- psql -X -q -c "drop role if exists $r" >/dev/null 2>&1; done
runuser -u postgres -- psql -X -q -c "drop database if exists $DB" -c "create database $DB" >/dev/null

echo "== applying stub, migrations, fixtures =="
for f in "$WORK"/supabase/tests/support/00_*.sql "$WORK"/supabase/migrations/*.sql "$WORK"/supabase/tests/support/01_*.sql "$WORK"/supabase/tests/support/02_*.sql; do
  out=$(run $DB -f "$f") || { echo "FAILED applying $(basename "$f")"; echo "$out"; exit 1; }
  echo "  ok  $(basename "$f")"
done

echo "== running tests =="
pass=0; fail=0
for t in "$WORK"/supabase/tests/t*.sql; do
  out=$( (echo "begin;"; cat "$t"; echo "rollback;") | run $DB -f - )
  p=$(echo "$out" | grep -c "PASS:"); pass=$((pass+p))
  if echo "$out" | grep -qE "FAIL:|ERROR:"; then
    fail=$((fail+1)); echo "  FAIL $(basename "$t") ($p passed before failure)"; echo "$out" | grep -E "FAIL:|ERROR:|DETAIL|CONTEXT" | head -6
  else echo "  ok   $(basename "$t") ($p assertions)"; fi
done
echo "== TOTAL: $pass assertions passed, $fail test files failed =="
[ "$fail" -eq 0 ]
