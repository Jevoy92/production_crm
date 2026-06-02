
# Palmer House Content Command Center — Phase 1 (Core Tracker MVP)

Per your build-in-phases note, Phase 1 ships the operating spine: **Dashboard, Core 12, 30-Day Sprint, Shoot Planner, Shannen Tasks, Content Library**. Repurposing Engine, Publishing Calendar, Photo-to-Video, and Analytics come in Phases 2–4.

## Scope (this phase)

### 1. New section in sidebar: "Content Command Center"
Top-level nav group with sub-routes:
- `/cc` — Dashboard
- `/cc/core12` — Core 12 grid + detail
- `/cc/sprint` — 30-Day Sprint (4 weeks)
- `/cc/shoots` — Shoot Planner
- `/cc/tasks` — Shannen Tasks
- `/cc/library` — Content Library

This is additive — existing Productions / Projects / Tasks / KPIs stay untouched. The new system is internal-content-only and does not replace the client production pipeline.

### 2. Dashboard (`/cc`)
- Stat cards: Total planned, Ready to film, Filmed, Sent to editor, Ready to publish, Published, Shorts created, Website videos done, Photo-to-video done
- Progress bars: Core 12 completion, Website library, Shorts goal, Photo-to-video goal, System video goal
- "Today's Focus" panel: main video, supporting shorts, website asset, Shannen prep checklist, Jevoy creative checklist
- Next shoot day + Bottlenecks (videos in "Needs Jevoy Review" or stale > 5 days)

### 3. Core 12 (`/cc/core12`)
- Views: **Grid**, **Kanban** (by status), **Table**, **Narrative sequence** (numbered flow 1→12). Calendar view deferred to Phase 3.
- Detail page (`/cc/core12/$num`) with all fields from your spec: number, title, series, Pal lane, primary/secondary platforms, business purpose, hypothesis, hook, audience, CTA, website placement, status, shoot date, script/filmed/editor/thumbnail/caption/published statuses, editor/Shannen/Jevoy notes, related shorts/website/photo/BTS asset lists
- Status pipeline: Idea → Outline Ready → Script Ready → Ready to Film → Filmed → Logged → Sent to Editor → Editing → Needs Jevoy Review → Ready to Publish → Scheduled → Published → Repurposed → Archived
- Seeded with all 12 titles, series, hypotheses, and shorts hooks from your doc

### 4. 30-Day Sprint (`/cc/sprint`)
Four week cards, each with: focus theme, Core 12 videos to film, shorts target, photo-to-video target, website videos, Shannen prep tasks, Jevoy creative tasks, editor handoff, publishing priorities, weekly review notes textarea. Pre-seeded with Weeks 1–4 from your doc (Translation Thesis → Camera+Process → Platform/Pricing → Founder Ecosystem).

### 5. Shoot Planner (`/cc/shoots`)
- List of shoot days + "New shoot day"
- Detail per shoot: date, location, theme, videos being filmed (linked to Core 12 / website / photo items), wardrobe, props, gear, lighting, audio, teleprompter, BTS plan, shot list with priority, time blocks, Shannen/Jevoy responsibilities, pickups
- Three built-in checklists: Before / During / After Filming (pre-seeded items, checkable)

### 6. Shannen Tasks (`/cc/tasks`)
- Task list scoped to internal-content work (separate from existing global tasks)
- Categories: Shoot prep, Production support, BTS capture, Files, Editor handoff, Captions, Publishing, Tracker updates, Weekly review
- Recurring weekday templates seeded (Mon Planning / Tue Production / Wed Photo+Shorts / Thu Handoff / Fri Distribution) with one-click "Generate this week's tasks"
- Sort by priority + recurring/one-off split (matches the pattern already used in the main Tasks page)

### 7. Content Library (`/cc/library`)
- Searchable table of every content item (any type — long-form, website, short, carousel, BTS, photo-to-video, sales, onboarding, system)
- Fields: title, type, platform, status, Pal lane, related Core 12, business purpose, CTA, shoot date, published date, file location, editor notes, caption, thumbnail idea, repurposing status (link only — engine itself in Phase 2), performance notes
- Filters: type, platform, status, Pal lane, related Core 12

## Data model

New types in `src/lib/types.ts`:
- `CoreTwelveVideo` (all fields above)
- `CCStatus` enum (14 stages)
- `SprintWeek` (week 1–4 with seeded focus + task lists)
- `ShootDay` (CC-specific; distinct from existing `Shoot`)
- `ContentItem` (library entry)
- `CCTask` (Shannen task with category + recurring flag)
- `ContentType`, `Platform`, `PalLane` enums

## Persistence
Following the existing pattern, all CC state lives in the shared `workspace_state` JSONB blob under a new `contentCommand` key, synced via the existing `cloudSync` flow. No new tables needed for Phase 1 — keeps it consistent with how Projects/Tasks/Shoots persist today and avoids a migration round-trip while we shake out the schema. We can promote to dedicated tables in a later phase if volume warrants.

## Seed data (loaded once on first visit)
- All 12 Core 12 entries with titles, series, hypotheses, hooks, suggested shorts
- 11 website trust videos from your list
- 5 system videos from your list
- Week 1–4 sprint plans with their video assignments
- Day 1–7 of the "First 7 Days" plan as pre-built shoot days/tasks

## Design
- Reuses existing dark theme + semantic tokens (`--primary` etc.) — no new color palette files
- Pal lane colors as semantic tokens added to `styles.css`: reel (orange), spotlight (purple), evergreen (sage), system (teal)
- Status badges, kanban columns, progress bars, dense card grids — same look as the existing Productions board so it feels native
- Sidebar gets a new collapsible "Content Command Center" group

## Out of scope (Phases 2–4, not built now)
- Repurposing Engine (1-to-12 generator)
- Publishing Calendar (drag-drop scheduling, platform-color calendar)
- Photo-to-Video dedicated workflow page
- Analytics / Review dashboard

## File-level plan

```text
src/lib/contentCommand.ts          (types, seed data, store slice helpers)
src/lib/store.ts                   (add contentCommand slice + actions)
src/styles.css                     (add 4 pal-lane tokens)
src/components/dashboard/Sidebar.tsx (add CC nav group)
src/routes/cc.tsx                  (layout w/ Outlet)
src/routes/cc.index.tsx            (Dashboard)
src/routes/cc.core12.tsx           (Grid/Kanban/Table/Narrative)
src/routes/cc.core12.$num.tsx      (Detail)
src/routes/cc.sprint.tsx           (4-week planner)
src/routes/cc.shoots.tsx           (list)
src/routes/cc.shoots.$id.tsx       (detail + 3 checklists)
src/routes/cc.tasks.tsx            (Shannen tasks)
src/routes/cc.library.tsx          (searchable library)
```

Phase 1 is roughly 1 sitting of work. Approve and I'll build it; after you've used it for a few days we tackle Phase 2 (Repurposing Engine).
