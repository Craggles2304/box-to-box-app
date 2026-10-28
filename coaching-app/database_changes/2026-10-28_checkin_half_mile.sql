-- APPLIED to Supabase project pyejkqrzhifwgdmrmxyj on 28 Oct 2026
-- (migration "coach_checkin_radius_half_mile"). Kept here as a record.
-- Coach GPS check-in: allow up to half a mile (805 m) from the pitch instead of 150 m.
-- Only the distance rule and its message change; permissions are kept by CREATE OR REPLACE.
-- The 75 m GPS-accuracy rule is unchanged.
do $$
declare d text; n text;
begin
  d := pg_get_functiondef('private.coach_training_gps_impl(uuid,timestamptz,text,float8,float8,float8,uuid)'::regprocedure);
  n := replace(d, 'if distance>150 then raise exception ''You must be within 150 metres of the pitch''; end if;',
                  'if distance>805 then raise exception ''You must be within half a mile of the pitch''; end if;');
  if n = d then raise exception 'training check-in rule not found; nothing changed'; end if;
  execute n;

  d := pg_get_functiondef('public.gps_match_checkin(text,float8,float8,float8,text,numeric)'::regprocedure);
  n := replace(d, 'IF d>150 THEN RAISE EXCEPTION ''Outside 150-metre match venue boundary''; END IF;',
                  'IF d>805 THEN RAISE EXCEPTION ''You must be within half a mile of the match venue''; END IF;');
  if n = d then raise exception 'matchday check-in rule not found; nothing changed'; end if;
  execute n;
end $$;

-- Venue radius used by the app's own "at the venue" badge (pinned venues only):
update public.venues set radius_m = 805, updated_at = now() where approx = false and radius_m < 805;
