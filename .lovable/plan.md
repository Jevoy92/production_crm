# Production OS — Executive Gauntlet, Pass 1 & 2

Note on Mobbin: the connected Mobbin MCP server is currently returning an integration error on every search, so no reference screens could be retrieved this turn. I'll retry it at the start of the build; if it stays down I'll work from established pattern knowledge (Linear, Sunsama, Superhuman, Motion, Raycast) and flag every place a live reference would have changed a call.

## Scope of this run

The brief covers 7 passes. Attempting all of them in one go produces shallow work everywhere. This plan covers **Pass 1 (Foundation)** and **Pass 2 (Daily Operating Loop)** — the surfaces that decide whether the product feels executive-grade. Later passes follow in subsequent runs, same loop.

Nothing in the navigation architecture is renamed, moved, merged, or deleted. Any structural idea gets written up as an ARCHITECTURE PROPOSAL in the ledger instead of implemented.

## Pass 1 — Foundation

- Audit `src/styles.css` tokens against actual usage; find hard-coded colors, one-off radii, ad-hoc padding across routes and fix at token level.
- Establish a small shared primitive set for the patterns already repeated by hand: section header, stat strip cell, list row, inline empty state, skeleton. These replace hand-rolled markup rather than adding a new layer.
- Card-soup audit: every bordered container on Today, Tasks, Schedule. Containers that only group two lines of text become spacing + typography.
- Density rules per surface type (calm / dense / sparse / visual), written down so later passes don't drift.
- Focus rings, keyboard targets, reduced-motion, contrast in both themes.

## Pass 2 — Daily Operating Loop

Surfaces, each through Researcher → Builder → Critic with a forced winner:

1. **Today** — restructure so the 10-second test passes: day interpretation and what's at risk sit above the fold; metrics and charts move below interpretation, not above it. Keep Today's Vibe, Pulse, Insights, Path, Watch-outs, Recap, Script Ideas — all of them stay, the ordering and weighting change.
2. **Today's Path** — time blocks become execution containers: intended outcome, contained tasks, progress, prep, related meeting, notes. Enter-a-block interaction rather than read-only timeline.
3. **Watch-outs** — reworked from signal tags into exception records: what happened, why it matters, urgency, cost of ignoring, resolving action. Derived from real store state (overdue tasks, stale waiting-on, approval latency, shoot readiness, publishing gap), with a severity threshold so the list stays short.
4. **Daily Insights** — interpretation over summary: comparative and second-order statements built from actual counts, not restated rows.
5. **Yesterday Recap** — completed / moved / slipped / still open / waiting on, so the morning has continuity.
6. **End of Day Sync** — closure ritual: close loops, carry unfinished work to tomorrow, capture unresolved threads, update waiting-on. Calmer after than before.
7. **Focus Mode** — stripped to task, why, time left, checklist, notes, next; interruption capture without leaving.

Cross-cutting in this pass: a **Waiting On** state as a first-class field surfaced in Today and Watch-outs, and **quick capture** (keyboard-invoked, one field, structure later).

## Technical notes

- Watch-outs, Insights, Recap are derived selectors over the existing Zustand store plus calendar data — no schema invention unless a field genuinely does not exist, in which case it's added to the store types and persisted the same way tasks already are.
- Waiting-on and block notes persist through the existing local persistence path used by sub-tasks.
- Charts stay Recharts; no new chart dependency.
- Every surface gets before/after screenshots via Playwright at desktop and mobile widths for the critic phase.

## Improvement ledger

`docs/gauntlet-ledger.md`, one row per surface: current problem, references, principle learned, change made, why, critic verdict, remaining weakness. It carries forward into passes 3–7.
