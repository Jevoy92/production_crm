## Goal

The Today page currently shows "Today's Path" but never surfaces the Limitless pendant insights that the 7am morning-digest job already pulls. Add a dedicated **Palmer House — Daily Insights** card above Today's Path that shows a business-focused summary extracted from yesterday's pendant transcripts.

## Approach

Reuse the existing `morning-digest` pipeline instead of adding a second Limitless fetch. Extend the prompt to also produce a Palmer House-specific insights block, store it alongside the existing digest, and render it as a new card on Today.

## Changes

### 1. Extend the morning digest (`src/routes/api/public/hooks/morning-digest.ts`)

- Add a new section to the system prompt: **Palmer House Daily Insights** — a 3–6 bullet summary derived from yesterday's Limitless pendant transcripts, filtered to anything Palmer House-related. Filter = union of (a) explicit mentions of Palmer House / PH / known clients, (b) production/sales/ops/hiring/finance talk, and (c) LLM judgment for anything else business-relevant. If nothing qualifies, emit `_No Palmer House activity captured yesterday._`
- Return the insights as a distinct markdown block so the client can split it out. Simplest: emit a fenced delimiter (`<!-- palmer-insights:start -->` … `<!-- palmer-insights:end -->`) inside `body_md`. No schema change needed — reuse the existing `morning_digests` table.

### 2. New server function (`src/lib/morningDigest.functions.ts`)

- `getTodayDigest()` — authenticated `createServerFn` using `requireSupabaseAuth` that reads today's row from `morning_digests` and returns `{ date, fullMarkdown, palmerInsights }` where `palmerInsights` is the substring between the delimiters (or `null`).

### 3. New card (`src/components/dashboard/PalmerInsightsCard.tsx`)

- Card matching the visual language of Watch-outs / Yesterday Recap (dark surface, subtle border, small header with icon + "Palmer House — Daily Insights" + "from pendant" chip).
- Renders the extracted markdown via the existing `Markdown` component.
- Empty state: muted line "No Palmer House activity captured yesterday."
- Error / not-yet-generated state: muted line "Today's digest hasn't been generated yet — check back after 7 AM."

### 4. Wire into Today (`src/routes/index.tsx`)

- Fetch via `useQuery` + `useServerFn` (not loader — protected fn, public-safe pattern).
- Render the card in the main column, immediately above the existing "Today's Path" block. No changes to Today's Path itself.
- move script ideas section on Today Page to the top

## Non-goals

- No new Limitless API calls, no new table, no changes to the 7am cron schedule, no changes to the right rail.