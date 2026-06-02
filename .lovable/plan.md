# Dissolve Content Command Center + Build Real Repurposing Engine

## Goal
Kill the `/cc` shell with its 8-tab navigator. Fold each sub-page into the top-level page it duplicates. Replace the misnamed "Photo → Video" with an actual Repurposing Engine: pick one of the 12 long-form scripts → AI drafts 3 supporting shorts → shorts auto-save to the Library, linked back to the parent script.

## Sidebar after this change (Work group)
```
Today
Content        → was /cc/library (renamed route /content)
Scripts        → /scripts (Core 12 lives here, plus Repurpose tab)
Repurpose      → /repurpose (new — Long-form → 3 Shorts engine)
Productions
Schedule       → absorbs Shoot Planner
Tasks          → absorbs Weekly Cadence (filter chip)
Studio
```
"30-Day Sprint" becomes a small widget on Today; it does not get its own page or sidebar entry. CCNav and the `/cc` route are removed entirely.

## Route changes

### Delete (route file + any UI-only state)
- `src/routes/cc.tsx` (overview dashboard)
- `src/routes/cc.core12.tsx` and `src/routes/cc.core12.$num.tsx` — Core 12 IS the 12 scripts; `/scripts/$num` already exists and is the canonical detail
- `src/routes/cc.sprint.tsx`
- `src/routes/cc.shoots.tsx` and `src/routes/cc.shoots.$id.tsx` — `/schedule` + `/shoots/$id` already exist
- `src/routes/cc.tasks.tsx` (Weekly Cadence) — fold into `/tasks` with a "Cadence" filter chip
- `src/routes/cc.photo-to-video.tsx` — replaced by `/repurpose`
- `src/routes/content.tsx` (current deprecation banner page)
- `src/components/cc/CCNav.tsx`

### Keep / move
- `src/routes/cc.library.tsx` → rename to `src/routes/content.tsx`, becomes the canonical Content page. Sidebar "Content" already points to this. Strip CCNav from it. Keep all Library functionality (filters, drawer, drag).
- `src/lib/ccStore.ts` — keep the slice; it stores `library`, `core12`, `tasks`. We continue to use `library` for content items and `core12` only as the "12 scripts metadata" backing the Scripts page lane badges. `tasks` slice gets retired (see below).

### New
- `src/routes/repurpose.tsx` — list of the 12 long-form scripts on the left, editor on the right. "Generate 3 shorts" button calls a server function, AI returns 3 short scripts (hook + body + CTA back to the long-form), shorts are immediately inserted into ccStore `library` as `type: "Short"` items linked via `parentScriptNum`. User can edit each short inline; edits persist to library.
- `src/lib/repurpose.functions.ts` — `createServerFn` POST handler using AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview`) with `Output.object` for structured 3-shorts schema. Reads `LOVABLE_API_KEY` inside the handler.

## Folding plan

| Old location | Where it goes |
|---|---|
| /cc (overview) | Today already has Sprint snapshot, this-week publishing, today's task; nothing else to move |
| /cc/core12 list | `/scripts` list (already shows the 12) |
| /cc/core12/$num | `/scripts/$num` |
| /cc/sprint | Today page "Sprint" widget (already implemented Nov refactor) |
| /cc/shoots | `/schedule` (calendar already shows shoots) |
| /cc/shoots/$id | `/shoots/$id` (already exists) |
| /cc/tasks (Weekly Cadence) | `/tasks` with a "Cadence" filter chip; migrate ccStore cadence tasks into main `tasks` slice via a one-time v17 store migration |
| /cc/library | `/content` (renamed route) |
| /cc/photo-to-video | DELETED, replaced by `/repurpose` |

## Repurposing Engine spec

**Inputs:** chosen long-form script (one of the 12), short-form platform targets (default Instagram Reel, YouTube Short, TikTok).

**Output schema (zod, Output.object):**
```
{ shorts: [{ platform, hook, body, cta, durationSec }, …3] }
```
Each short must:
- Have a hook ≤ 7 seconds of read time
- Tease one specific idea from the long-form
- End with CTA explicitly funneling to the long-form ("Full breakdown on YouTube — link in bio", etc.)

**On generate:** server fn returns the 3 shorts; client inserts 3 new `ContentItem` rows into `ccStore.library` with `type: "Short"`, `lane: parent.palLane`, `parentScriptNum: n`, `status: "Ready to Film"`. User sees them appear in the right pane and can edit / send to Content.

**Linkage:** Library `ContentItem` gets one new optional field `parentScriptNum?: number`. The Content (`/content`) page shows a small "↳ from #4 The Camera Lie" chip on shorts that have it.

## ccStore migrations (v17)
- Drop `photoAssets` slice and all related actions.
- Migrate `tasks` slice into main `store.tasks` (each cadence task becomes a normal Task with `category: "Cadence"`). Drop `tasks` from ccStore.
- Add `parentScriptNum?: number` to `ContentItem`.

## Sidebar update
`src/components/app/AppSidebar.tsx`:
- Replace `{ label: "Content", to: "/cc", icon: Command }` with `{ label: "Content", to: "/content", icon: Command }`
- Add `{ label: "Repurpose", to: "/repurpose", icon: Sparkles }` directly after Scripts
- No other changes

## Out of scope
- Visual redesign of the Library/Schedule/Tasks pages beyond what's needed to remove `<CCNav />`
- Persisting the Repurpose conversation to Supabase (it's a one-shot generation, no chat history)
- Image generation for shorts thumbnails
- Auto-scheduling the generated shorts onto the calendar (user drags them from Library → Schedule like today)

## Verification
1. Sidebar shows the new structure; clicking each item lands on a real page with no CCNav bar
2. `/scripts/$num` shows everything that used to be on `/cc/core12/$num`
3. `/repurpose` generates 3 shorts in <15s, shorts appear in `/content` Library immediately with the parent-script chip
4. `/tasks` shows former Weekly Cadence items with a Cadence filter chip
5. All deleted routes return TanStack's notFound (no broken links from anywhere in the app — grep first)
