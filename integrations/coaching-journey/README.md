# Box to Box — Player Journey embedded module

This is an **integration module** for the existing **Box to Box Coaching App**. It is not a replacement application and is not deployed to the live site yet. It uses the already-connected Supabase project and the coach/parent's existing authenticated Supabase client.

## What it does

- **Coaches and directors**: select one current target per Technical, Physical, Psychological and Social corner; capture evidence; approve/reject n8n's proposed parent summaries; approve their own suggested training plans; accept suggested missions; verify mission evidence.
- **Families**: view only approved parent updates for the linked child, try optional home challenges, record a brief reflection, see coach-verified missions and XP, and opt in to an open Performance Hub group.
- **n8n** remains server-side; no API tokens or n8n URLs are exposed in this code.
- **Supabase Row Level Security** is the real access control, not the client-side UI. Don't replace the existing client with a service-role/secret credential.

## Wiring into the actual Coaching App

Copy `journey.js` and `journey.css` into the Coaching App's own deployable source directory. The existing live Netlify site currently uses a **manual drop deployment**, not this repository; copying these files into `Craggles2304/box-to-box-app` alone does **not** publish to `boxtobox-coaching.netlify.app`.

Load the stylesheet once:

```html
<link rel="stylesheet" href="/journey.css">
```

In the existing authenticated coach/parent player-detail panel, provide a mount point and reuse the **already signed-in Supabase client**:

```js
import { mountPlayerJourney } from '/journey.js';

let leaveJourney = () => {};
function showJourney(existingSupabaseClient, selectedPlayerId) {
  leaveJourney();
  const root = document.getElementById('player-journey-panel');
  leaveJourney = mountPlayerJourney({
    root,
    supabase: existingSupabaseClient,
    playerId: selectedPlayerId,
  });
}
// Call leaveJourney() when switching selected player or leaving the view.
```

```html
<div id="player-journey-panel"></div>
```

**Do not** bundle a service-role key. The module derives `auth.getUser()` from the host app's existing session and looks up the signed-in user's server-managed `profiles.role`.

## Database and backend it expects

The following are already present on project `pyejkqrzhifwgdmrmxyj`: `player_corner_focus`, `passport_update_drafts`, `passport_parent_updates`, `player_training_recommendations`, `player_mission_suggestions`, `player_missions`, `academy_mission_catalog`, `player_home_challenges`, `player_home_challenge_reflections`, `performance_hub_groups`, `performance_hub_interest`, plus the relevant guarded RPC functions.

Relevant server automation names:
- `Box to Box | Passport → Coach Approval Drafts` (creates drafts, does not publish)
- `Box to Box | Four Corners → Training Drafts` (proposes, coach approves)
- `Box to Box | Four Corners → Mission Suggestions` (proposes, coach assigns)
- `Box to Box | Seven-Phase Director Intelligence` (admin-only aggregate report)

**These n8n schedules are inactive pending an end-to-end test and explicit activation approval.** For a test, have a coach account create a Four Corner target for an authorised player, execute the corresponding draft workflow manually in n8n, and confirm the coach sees the draft. Do not use a real child's identifiable data during synthetic tests.

## Known limitations / next checks

- Published updates appear **inside** the parent page on refresh. This package deliberately doesn't send emails or push notifications.
- The Training Drafts workflow creates a 20-minute plan **for coach review**, not an automatic booking.
- Performance Hub is enquiry-only (maximum five players per group), with no payments or session bookings.
- Session-plan approval only works for the coach who set the Four Corner target; admin reassignment should be handled by an explicit server-side workflow.
- The module has no public leaderboard, rankings of child ability or automatic learning scores.
- n8n manual execution and a full authenticated end-to-end browser test are still required before production use.
- Supabase security advisories reported in the existing project must be reviewed before wider rollout.

## Production deployment blocker

The `boxtobox-coaching` Netlify project currently reports `manual_deploy: true`, `deploy_source: drop`, `commit_ref: null`, and `has_source_zip: false`. The connected Netlify tool can inspect deployments but does **not** expose the site assets or a deploy-files action. To integrate safely, obtain the **actual ZIP/source directory used for the production Netlify drop**, add the module to the existing coach and parent views, test with Supabase Auth, then upload a complete new site build to Netlify. A GitHub feature branch is a reviewable handoff, **not** a live deployment.