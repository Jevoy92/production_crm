# Site Audit + Unify + Strip Seed Data

## What I found (audit)

The app currently behaves like 3 overlapping mini-apps stitched together. Concrete dead/duplicate surfaces:

**Duplicate "content" systems (3)**
- `/cc` — Content Command Center (its own dashboard, own tabbed nav with Core 12, Sprint, Shoots, Tasks, Library, Photo→Video, Calendar)
- `/content` — Content Pipeline (kanban using a separate `contentPieces` slice on the main store)
- `/productions` — Project pipeline (yet another kanban for client work)

Three stores of "things being made," none of which talk to each other.

**Duplicate task lists (2)**
- `/tasks` (main store `tasks`)
- `/cc/tasks` ("Shannen Tasks", CC store)

**Duplicate dashboards (2 entry points + 1 hidden)**
- Sidebar root `/` redirects to `/kpis/owner|cfo|pa` (role dashboard)
- `/cc` is its own dashboard with stat cards, sprint progress, and a separate tab bar — this is what you hit and confused you. None of the sidebar links are reachable from inside `/cc` except by clicking sidebar items (CCNav is local to `/cc/*`).

**Duplicate script tools (2)**
- `/scripts` — read-only library (`scriptsIndex.ts`, your real scripts)
- `/studio` — AI script editor (server-fn backed)

**Duplicate scheduling (2)**
- `/schedule` — calendar with publishing view (already extended)
- `/cc/shoots` — shoot planner cards

**Sidebar has 19 items**, several pointing to functionally overlapping pages, and "Templates" / "Brand" / "Checklists" are admin-ish entries mixed in with daily-work entries with no grouping.

**Seed data sources still firing**
- `src/lib/seed.ts` — 1453 lines, but `SEED.clients/projects/shoots/gearItems/gearKits/assets/tasks/contentPieces/trackedKpis` are already empty arrays. The only fake data left here is unused PROJECT/CLIENT/SHOOT/etc constants sitting dead in the file.
- `store.ts` v15 migration injects 9 × 3 = 27 fake "recording todos" into `tasks` on load.
- `ccStore.ts` seeds 7 sample `SEED_SHOOTS` (Day 1–7 with no real dates) and 4 sample `photoAssets` (backlit founder portrait, kingston golden hour, etc.) — fake.
- `clearSeedData` button still in sidebar.

What is REAL and stays:
- `scriptsIndex.ts` (your scripts)
- `playbooksSeed.ts` (your playbook)
- `ccStore` constants: `C12_RAW` (your 12 video concepts), `SPRINT_WEEKS`, `RECURRING_TASKS` (real weekly template), `WEBSITE_TITLES`, `SYSTEM_TITLES`
- `TEAM` in seed.ts (Jevoy, Adrienne, Shannen)
- `DEFAULT_TEMPLATES` (checklist templates)

## What I'll do

### 1. Permanent seed-data purge
- `ccStore.ts`: replace `SEED_SHOOTS` with `[]`, replace sample `photoAssets` with `[]`. Bump persist version to force-flush old fake entries from existing localStorage.
- `store.ts`:
  - Delete `clearSeedData` action entirely (and remove `resetData` since it also re-seeds — both gone).
  - Delete the v15 migration block that injects the 27 recording todos. Bump version + add a migration step that nukes any task whose id starts with `t_rec_` so existing users stop seeing them.
- `seed.ts`: delete every unused constant (`PROJECTS`, `CLIENTS`, `SHOOTS`, `GEAR_ITEMS`, `GEAR_KITS`, `ASSETS`, `CONTENT_PIECES`, `TRACKED_KPIS`, `TASKS`, the dead `iso()` helper). Keep `TEAM`, `DEFAULT_TEMPLATES`, `buildChecklistsFromTemplate`, `buildChecklists`, and a slimmed `SEED` export.
- `Sidebar.tsx`: remove the "Delete Seed Data" button + its `hasData` / `clearSeedData` wiring.

### 2. Consolidate the sidebar (no new pages, no deletions of working pages)
Group + rename so the IA matches what each page actually does. New nav order:

```
WORK
  Today          → /                    (was: redirected to role KPIs; now a single unified home — see step 3)
  Content        → /cc                  (kept — Core 12, sprint, shoots, library, photo→video, calendar)
  Productions    → /productions         (client work pipeline)
  Schedule       → /schedule            (already unified)
  Tasks          → /tasks               (one global task list — see step 4)
  Scripts        → /scripts             (your library)
  Studio         → /studio              (AI editor)

CLIENTS & TEAM
  Clients        → /clients
  Team & KPIs    → /team
  Scoreboard     → /scoreboard

OPERATIONS
  Assets         → /assets
  Gear           → /gear
  Checklists     → /checklists
  Playbooks      → /playbook
  Finance        → /finance
  Analytics      → /analytics

ADMIN
  Brand          → /brand
  Templates      → /admin/templates
  Settings       → /settings
```

Removes orphan/duplicate "Content Pipeline" link (`/content`) from the sidebar — see step 5.

### 3. One dashboard, not two
- Make `/` render an actual unified home (not a redirect). It shows: role switcher at top, then the role's KPI cards (owner/cfo/pa) + Content Command sprint snapshot + this-week publishing strip + today's top tasks.
- `/cc` stays as the Content workspace but its top stat cards become a compact strip (no duplicate "dashboard" feel). The user lands on `/` for the daily glance, clicks "Content" for the workspace.
- Old `/kpis/owner|cfo|pa` routes remain (deep links) but the home no longer redirects to them.

### 4. Merge tasks into one global list
- `/cc/tasks` becomes a filtered view of `/tasks` (filter chip: "Content / Shannen") — same underlying task model. To avoid a risky data migration, do this lightweight: `/cc/tasks` keeps using `ccStore.tasks` for now BUT the CCNav "Shannen Tasks" tab is renamed to "Weekly Cadence" so it's clearly the recurring-template view, while the main `/tasks` is the global day-to-day list. (Full schema merge would require migrating ccStore tasks into main store — defer; flag in plan as Phase 2 if you want it.)

### 5. Retire `/content` as a sidebar entry
- The `contentPieces` kanban duplicates `/cc/library`. Remove it from sidebar. Keep the route file so any saved links don't 404, but add a banner at the top: "This view moved into Content Command → Library" with a link. (Deleting the route + its store slice would be a 3-file delete; happy to do that if you'd rather kill it outright — say the word and I'll nuke it next pass.)

### 6. Fix small dead-link / layout issues caught during audit
- `Sidebar.tsx`: "Productions" badge counts `activeProjects`; since seed projects are gone, this will now show `0` until you add real ones — leave it (correct behavior), but hide the badge when count is 0 so the empty `0` chip doesn't look broken.
- `CCNav.tsx` "Dashboard" tab routes to `/cc` (works) but visually is just stat cards. After step 3, rename it to "Overview" so it doesn't conflict with the new global `/` dashboard mental model.
- Verify every CCNav tab resolves: Core 12 ✓, Sprint ✓, Shoots ✓, Photo→Video ✓, Tasks ✓, Library ✓, Calendar ✓ — no dead links there, but the user reported "tabs did nothing" — likely the in-page tabs inside `/cc/core12/$num` or `/cc/shoots/$id` that don't have routes wired. Will re-check those two detail pages and patch.

### 7. Verify
- Run a build + scan console for unresolved imports after the seed.ts trim.
- Click every sidebar item + every CCNav tab on the preview to confirm none are dead.

## Out of scope (call out)
- Full data-model merge of `ccStore` into `store` (one giant store) — that's a multi-day refactor; not doing it here.
- Designing a new home page from scratch — the new `/` is composed from existing primitives.
- Deleting `/content` route + its `contentPieces` store slice (only retiring from nav unless you say "delete it").

Approve and I'll execute steps 1–7 in one pass.
