# Production OS — Design System Rules

> **Read this before generating or editing ANY UI in this repo.** These rules are the
> product owner's locked decisions. Follow them exactly — do not reintroduce patterns
> listed as banned, and reuse the existing primitives instead of inventing new ones.

## 1. Hard bans (never do these)

- **NO colored accent strips on cards.** No gradient top bars (`h-0.5`/`h-1 bg-gradient-to-r`
  pinned to a card's top edge) and no colored left-border bars (`borderLeft: 3px solid …`)
  on cards, rows, or pills. They were deliberately removed app-wide. Convey category/status
  with tinted chips, icon boxes, and text color instead
  (pattern: `text-emerald bg-emerald/10 border border-emerald/25`).
- **No abstract, unlabeled graphics.** Every chart must carry real measurements
  (see §4). A bar with no axis, numbers, or context is banned.
- **No hardcoded palette colors in charts or canvases** (`#52525b`, `rgb(24,24,27)`,
  `zinc-600`, …). Always use the CSS variables so light/dark themes both work.
- **No new visual languages.** No new fonts, shadows, radii, or color ramps. Use the
  tokens and primitives below.

## 2. Tokens (CSS variables — defined in `src/styles.css`, both themes)

- Surfaces: `--bg`, `--panel`, `--sunken`, `--raised` (Tailwind: `bg-app`, `bg-panel`,
  `bg-sunken`, `bg-raised`)
- Lines: `--line`, `--line-2` (`border-line`, `border-line-strong`)
- Text: `--text-hi`, `--text-mid`, `--text-lo` (`text-hi`, `text-mid`, `text-lo`)
- Brand: `--brand-400/500/600/700`; accents: `--accent-violet/amber/emerald/cyan/rose/orange`
- Type: Syne (`font-display`) for headings/numbers with personality, Inter for body,
  `font-mono` + `.num` (tabular numerals) for any time/duration/metric digits.
- Buttons/inputs: `.ph-btn` (`-primary`, `-soft`, `-sm`), `.ph-input`, `.ph-select`.
- Glow/tint math: `color-mix(in oklab, var(--brand-500) N%, transparent)` — this is the
  house technique for glows, tinted fills, and hover shadows.

## 3. Shared primitives (REUSE — do not rebuild)

From `src/components/app/AppShell.tsx`:
- `AppShell` — page wrapper: topbar title/subtitle/eyebrow/actions, ambient `.page-canvas`
  glow, entrance animation. Every page renders inside it (or `Shell`, which wraps it).
- `MetricCard` / `StatTile` — stat cards with **auto-animated count-up** for numeric
  values and a soft corner `AccentGlow`. Pass plain numbers to get animation free.
- `Progress` — animated fill bar. `SegmentedControl` — tab pills.
- `Collapsible` — animated fold with rotating chevron; use for any long/secondary
  section (`defaultOpen={false}` for archival content). This is the standard
  density pattern.

From `src/components/motion/Motion.tsx`: `Reveal`, `Stagger`, `StaggerItem`,
`AnimatedNumber`, `HoverLift`.
From `src/components/charts/Charts.tsx`: `AreaTrend` (gradient area, soft dashed grid),
`ChartTooltip` (the ONLY tooltip style for recharts).
Utilities: `.card-elevated` (hover-lift card), `.card-lift`, `celebrate()` from
`src/lib/confetti.ts` (confetti on completions), notification store in
`src/lib/notifications.ts` (bell events — use `notify()` for anything noteworthy).

## 4. Charts & data visuals — "detailed and amazing, not add-ons"

Every chart MUST include, where applicable:
1. **Numbers on the visual itself** — value labels on bars (`LabelList`), % labels on
   donut slices, totals in legends ("High · 3 · 12 open total").
2. **Axes with real ticks** — integer Y axis (`allowDecimals={false}`), labeled X axis,
   `CartesianGrid` dashed with `stroke="var(--line)"`, axis text `var(--text-lo)`.
3. **`<ChartTooltip />`** for hover detail (never recharts' default or an inline style).
4. **Theme-aware colors** — `var(--brand-500)`, `var(--accent-rose)`, `var(--line-2)`.
5. **Animated entrance** — recharts' draw-in or `motion.div` height/width animations.
6. Center labels in donuts (total + unit), min/% pairs in legends, units everywhere
   (`4h 12m`, `$1,250`, `45%` — never bare numbers without units or context).

Reference implementations: Team Workload bar chart + Day Mix donut in
`src/routes/index.tsx`, the Focus analytics in `src/routes/focus.tsx`,
`AreaTrend` in `src/components/charts/Charts.tsx`.

## 5. Motion & liveliness (the app should feel alive)

- Numbers count up (`AnimatedNumber` — automatic in MetricCard/StatTile).
- Cards lift on hover (`.card-elevated` / `.card-lift` — already global).
- Sections animate in (`Reveal` / `Stagger` on grids; AppShell animates page entrance).
- Completing a task fires `celebrate(event)` confetti from the click point.
- Notifications: animated bell badge (spring pop + ring shake) — push via
  `useNotifications().notify()`; toasts via `sonner`'s `toast()`.
- All motion must respect `prefers-reduced-motion` (the primitives already do).

## 6. Layout & hierarchy

- **Topbar** (in `AppShell`): page identity on the left (eyebrow → title → subtitle);
  page-specific action buttons next; then a **visually separate utility cluster**
  (search · calendar · help · bell · theme) inside a `bg-sunken/60 border border-line
  rounded-2xl p-1` pill, divided from actions by a vertical line. Keep this structure.
- **Sidebar**: grouped nav with expandable parent tabs (children indent under a left
  border rail; parent auto-expands when a child route is active). Pattern lives in
  `AppSidebar.tsx` (`NavRow`). New routes should join an existing parent before
  becoming a new top-level item.
- **Density**: prefer chips, progress bars, count badges, and key-value tile grids over
  paragraphs. Long lists fold in `Collapsible`. Subtitles are counts ("12 items · 3 in
  repair"), not sentences.
- **Mobile**: every grid needs responsive prefixes (`grid-cols-1 sm:grid-cols-3`),
  wide tables get `overflow-x-auto`, fixed widths use `min()` guards. 760px breakpoint
  collapses the shell; the sidebar becomes an off-canvas drawer.

## 7. The AI launcher

The floating Pals launcher (`.pals-launcher` in `src/styles.css`) is a **circular avatar
with a spinning conic-gradient halo + breathing glow** (Gemini-style). Don't flatten it
back into a square/static button.

## 8. Tone

Premium, cinematic, dense, dark-first (light theme equally supported — test both).
Every visual should answer "what does this tell me?" with a number, a comparison, or a
state — decoration without information is noise.
