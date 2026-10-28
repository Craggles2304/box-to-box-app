-- Box to Box: coach GPS check-in distance -> half a mile (805 metres)
--
-- How to run: Supabase dashboard > SQL Editor > New query > paste all of this > Run.
-- Safe to run more than once. It only touches:
--   1. venues.radius_m (raised to at least 805 m)
--   2. the two check-in functions, coach_training_gps and gps_match_checkin:
--      only lines that mention distance/radius/metres and use the number 150
--      have 150 changed to 805. Nothing else in those functions changes, and
--      their permissions are kept.
-- The "Messages" tab shows every line it changed. If it says NO CHANGE for a
-- function, nothing was altered: copy that function's text from the first
-- query and send it over so the rule can be changed by hand.

-- 0) Look first (read only): the current check-in functions
select p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('coach_training_gps', 'gps_match_checkin');

begin;

-- 1) Venue radius used by the app's own "at the venue" badge
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'venues' and column_name = 'radius_m') then
    update public.venues set radius_m = 805 where radius_m is null or radius_m < 805;
    raise notice 'venues.radius_m raised to at least 805 m';
  else
    raise notice 'venues has no radius_m column; skipped';
  end if;
end $$;

-- 2) Server-side check-in rule: 150 m -> 805 m
do $$
declare
  r record;
  def text;
  new_def text;
  line text;
  new_line text;
  lines text[];
  changed int;
begin
  for r in
    select p.oid, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('coach_training_gps', 'gps_match_checkin')
  loop
    def := pg_get_functiondef(r.oid);
    lines := string_to_array(def, E'\n');
    changed := 0;
    for i in 1 .. coalesce(array_length(lines, 1), 0) loop
      line := lines[i];
      if line ~* '(dist|radius|within|metre|meter|too far|away)' and line ~ '\m150(\.0+)?\M' then
        new_line := regexp_replace(line, '\m150(\.0+)?\M', '805', 'g');
        new_line := regexp_replace(new_line, '805 ?(metres|meters|m)\M', 'half a mile', 'gi');
        raise notice '% line %: %  -->  %', r.proname, i, btrim(line), btrim(new_line);
        lines[i] := new_line;
        changed := changed + 1;
      end if;
    end loop;
    if changed = 0 and def ~ '\m805\M' then
      raise notice '% : already half a mile (805 m), nothing to do', r.proname;
    elsif changed = 0 then
      raise notice '% : NO CHANGE (no 150 m distance rule found). Send this function''s text over.', r.proname;
    else
      new_def := array_to_string(lines, E'\n');
      execute new_def;
      raise notice '% : updated % line(s)', r.proname, changed;
    end if;
  end loop;
end $$;

commit;
