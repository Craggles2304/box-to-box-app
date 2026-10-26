# Box to Box — Player Journey embedded module

Version 2 (26 October 2026): improved coach confirmation, parent privacy, completed challenges and automated-draft safeguards.

This is an **integration module** for the existing **Box to Box Coaching App**. It is not a replacement application and is not deployed to the live site yet. It uses the already-connected Supabase project and the coach/parent's existing authenticated Supabase client.

## What it does

- **Coaches and directors**: select one current target per Technical, Physical, Psychological and Social corner; capture evidence; approve/reject n8n's proposed parent summaries; approve their own suggested training plans; accept suggested missions; verify mission evidence.
- **Families**: view only approved parent updates for the linked child, try optional home challenges, record a brief reflection with a saved indicator, see coach-verified missions and XP, and opt in to an open Performance Hub group.
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

**Current security design:** the family display of Four Corner focus uses the restricted `family_four_corner_focus` RPC, so private coach evidence cannot be fetched by a guardian from `player_corner_focus`.

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
- Session-plan approval works for the originating coach and director. Other coaches cannot take ownership of an existing plan.
- Coach approval of a parent summary now requires explicit confirmation; success messages are shown after the database finishes saving.
- Internal draft instructions have been removed from n8n parent-facing copy; source assessments without a meaningful observation are left queued for review.
- n8n recommendations are idempotent on retry and match suggested missions to the coach’s actual focus text.
- Parent reflections are shown as completed after submission; no automatic sharing or alerts occur.
- The module has no public leaderboard, rankings of child ability or automatic learning scores.
- Automated tests: 9 passing node tests. These are **mocked client tests**; they do not substitute for a live signed-in parent/coach browser test.
- n8n manual execution and a full authenticated end-to-end browser test are still required before production use.
- Supabase security advisories reported in the existing project must be reviewed before wider rollout.

## Production deployment blocker

The `boxtobox-coaching` Netlify project currently reports `manual_deploy: true`, `deploy_source: drop`, `commit_ref: null`, and `has_source_zip: false`. The connected Netlify tool can inspect deployments but does **not** expose the site assets or a deploy-files action. To integrate safely, obtain the **actual ZIP/source directory used for the production Netlify drop**, add the module to the existing coach and parent views, test with Supabase Auth, then upload a complete new site build to Netlify. A GitHub feature branch is a reviewable handoff, **not** a live deployment.

## V2 engineering checklist

- [x] Prevent invalid UUID-shaped player references.
- [x] Escape player-supplied HTML in the user interface.
- [x] Require human confirmation before publishing a progress update.
- [x] Provide explicit success notices after saves, approvals and reflections.
- [x] Separate private coach observations from family-readable corner targets.
- [x] Enforce coach ownership or admin status before training-plan approval.
- [x] Mark home reflections as complete in the parent view.
- [x] Safeguard n8n drafts against missing evidence and internal instruction leakage.
- [x] Make training drafts and mission suggestions retry-safe.
- [x] Pass nine automated module tests and preserve the unchanged Netlify production deploy.
- [ ] Obtain complete production Coaching App ZIP/source (Netlify deploy is manual).
- [ ] Wire module into signed-in player detail and parent view.
- [ ] Test real session-based Supabase RLS from parent and coach accounts.
- [ ] Test real n8n workflow end to end and review output.
- [ ] Deploy the complete app ZIP, not this integration-only package.

**NEVER publish this integration ZIP alone to Netlify.** It is not the full Coaching App and lacks the app entry point.