BOX TO BOX — V51 "PRO" DESIGN PASS
Built 28 October 2026 on top of V50. Same features, same information, same data.

WHAT CHANGED
- New design layer b2b-features/pro.css (loaded last): pure black, one volt
  green (#CCFF00), Anton headings, condensed caps labels, pill buttons, flat
  cards with one corner radius. Replaces the green-tinted glow cards.
- Page headers are flat (no glowing hero box); the duplicate team label next
  to the team picker is hidden.
- Player Passport: the three stacked header boxes (passport banner, profile,
  rank) are now one athlete card with name, position, team, rank and XP bar.
  Tabs stay pinned while you scroll. Stats sit in one row. Four Corners are a
  tidy 2x2. The shortcut tiles are now a list with arrows.
- Coach passport (Coaching day > Player Passports): tighter header, task card,
  smaller text boxes, collapsible "More coaching tools".
- Tactics Hub: overview is a numbered list; tab bar fits on a phone; pitch
  and cue chips restyled; Save button stays in reach at the bottom.
- Coach Learning: one header with this week's progress; stats, steps,
  ratings and pathway restyled.
- Service worker cache and app version bumped so phones pick up the change.

STILL TRUE FROM V50
- auth.js only lets the director account sign in ("Private preview").
  Remove that line in auth.js before giving this to all coaches and families.
- Check it on a Netlify deploy preview first and keep the live deploy to roll
  back to.

----------------------------------------------------------------------
BOX TO BOX — V50
Built 27 October 2026 from the V49 package, with the font and navigation
regressions fixed. Deployable to Netlify as a drop.

WHAT THIS IS
V49 with three things repaired, plus a preview of the new design. It is NOT
the redesign applied to the real app — see WHAT THIS IS NOT.

WHAT WAS FIXED

1. FONTS — the reason V49 looked wrong
   V49 shipped with no fonts/ folder and no @font-face rules, so Anton,
   Barlow and Barlow Condensed all failed and every heading fell back to
   Impact. The three .ttf files are restored in fonts/, and the @font-face
   rules are inlined at the top of index.html, matching how the live V42
   build does it.
   Verified: Anton reports "loaded" in the browser.

2. BOTTOM NAVIGATION — six items in a five-column grid
   b2b-features/day-hub.css pins nav.tabs .wrap to repeat(5) with
   !important. premium-v49.css then adds a sixth item (More) and tries to
   switch to flex without !important, so it lost and More wrapped onto a
   second row. A six-column override is appended to premium-v49.css.
   Verified: all six tabs sit on one row at 375px.

3. DEAD FILE REMOVED
   review-base.css (153 KB) was never referenced by anything. Its only
   unique content was the three @font-face rules, now inlined. Removed.

   The service worker cache name was also bumped so returning users get the
   new fonts instead of the cached fontless version.

WHAT THIS IS NOT
- The six-hub redesign is NOT applied to the real app. The app still has
  its existing ten-tab navigation and its sixteen stylesheets.
- Nothing behind the login has been tested. The fixes above were verified
  on the sign-in screen and against the CSS; everything else is unchanged
  V49 code and carries V49's behaviour.
- The 298 unique colours and 26 corner radii across b2b-features/ are
  untouched. That is the next piece of work, not this one.

PREVIEW OF THE NEW DESIGN
  /preview/index.html
A working prototype of the six-hub app: Coach, Development, Parents, Match,
Tactics and Director hubs, plus the player passport, coach check-in,
calendar, coach CPD and the IDP. Switch between coach, player, parent and
director with the strip at the top. It uses example data and does not talk
to Supabase. It is there to show the direction, not to be deployed as the
app.

BEFORE YOU DEPLOY
- Check it on a phone first. Netlify deploy previews are free; use one
  rather than dropping this straight onto the live site.
- Confirm the fonts render (headings should be Anton, not Impact).
- Sign in as a coach and confirm the bottom bar is one row.
- Keep the current live deployment available to roll back to.
