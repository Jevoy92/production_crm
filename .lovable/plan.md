## Approach — native ports as primary, HTML hubs as backup

Build two real sections inside the Production OS using the existing design system (Shell, tokens, markdown renderer from the playbook), AND keep the original HTML hubs as static fallbacks. Best of both: the content is first-class inside the OS, but you can always click "Open original hub" if anything looks off.

## 1. Static backups (drop-in, no parsing)

- `public/hubs/scripts/` ← full `Palmer Scripts Hub copy/` folder (index.html + all .md subfolders), `.DS_Store`/`__MACOSX` stripped → served at `/hubs/scripts/index.html`
- `public/hubs/brand/index.html` ← `PHP_Brand_Hub.html` → served at `/hubs/brand/index.html`

Both kept byte-for-byte as uploaded.

## 2. Bundled markdown source

Copied into the repo so they import at build time (no runtime fetch, SSR-safe):

```
src/content/scripts/
  Originals/Script 01…12 - <title>.md       (12 master scripts)
  Versions/Script 01…12 - {Jevoy|Palmer House|MindYourBizniz}.md   (36 versions)
  Strategy/{Cross-Venture Master Brief, Palmer House Investigative Universe, YourBoyJevoy Strategy Engine}.md
  Research/{Recorded Animal Projection Map, Ecosystem Context}.md
  YourBoyJevoy/Something on My Mind - Scripts.md
  Skills/jevoy-palmer-operating-manual/{SKILL.md, references/*.md}
```

Loaded once via `import.meta.glob('…', { query: '?raw', eager: true })` in `src/lib/scriptsIndex.ts`, which exports a typed `SCRIPTS`, `STRATEGY`, `RESEARCH`, `MANUAL` index.

## 3. New routes — Scripts section

```
src/routes/scripts.tsx            → hub
src/routes/scripts.$num.tsx       → script detail (tabs: Original / Jevoy / Palmer House / MindYourBizniz)
src/routes/scripts.strategy.tsx   → strategy docs reader
src/routes/scripts.research.tsx   → research docs reader
src/routes/scripts.manual.tsx     → operating manual + 4 references (left rail)
```

All wrapped in the existing `Shell`. Markdown rendered with the same component the playbook detail page uses (extracted to `src/components/Markdown.tsx` if it's currently inlined). Tokens only — no raw colors.

### Hub page (`/scripts`)
- Top: 3 pinned cards — **Master Brief**, **Operating Manual**, **Open original hub ↗** (link to `/hubs/scripts/index.html`)
- Grid of 12 script cards: number, title, one-line thesis (parsed from the master brief), 3 chips (Jevoy / Palmer House / MindYourBizniz) that deep-link to that version
- Search + brand filter pills (All / Jevoy / Palmer House / MindYourBizniz)
- Side section: Strategy docs, Research docs, YourBoyJevoy

### Script detail (`/scripts/$num`)
- Back to /scripts, H1 title
- Tab bar: Original · Jevoy Palmer · Palmer House · MindYourBizniz (URL `?v=jevoy`)
- Meta sidebar: core idea, psychology refs, props, key analogy (from master brief)
- Body: rendered markdown
- Buttons: `Copy as plaintext`, `Download .md`, `Open original ↗` (links into `/hubs/scripts/Versions/…`)

## 4. New routes — Brand Hub

Simplest viable port — the brand hub is one ~2,100-line styled HTML doc with its own typography and lanes (Reel/Spotlight/Evergreen/System). Porting every section to React would be a large project; instead:

```
src/routes/brand.tsx
```

A short native landing page using OS tokens with:
- Pillar overview (4 lanes with their canonical hex from the source)
- Type system + neutrals summary
- Big CTA card: **Open full Brand Hub ↗** → `/hubs/brand/index.html` (opens in a new tab so the rich styling is intact)

If you later want the brand hub fully ported into the OS look, that's a separate sweep — flag it and I'll do it section-by-section.

## 5. Sidebar entries (append-only)

Two new items in `src/components/dashboard/Sidebar.tsx`, after `Templates`:
- **Scripts** (icon `FileText`) → `/scripts` (internal Link)
- **Brand** (icon `Palette`) → `/brand` (internal Link)

The "open original hub" links live inside the pages, not the sidebar, so the sidebar stays clean.

## 6. Formatting & rules followed

- Wrapped in existing `Shell`, uses `inputCls`, `Btn`, `Modal` primitives
- Semantic tokens only (no raw colors in components)
- TanStack file-based routes, `<Link>` not `<a>` for internal nav, type-safe params (`$num`)
- Each route declares its own `head()` meta (title + description)
- No SSR-unsafe code (all markdown imported at build time)
- No edits to `playbook`, `gear`, `tasks`, `seed.ts`, `store.ts`, or any existing route
- No backend / Cloud changes

## What does NOT change

Everything currently in the app stays exactly as it is. This is pure addition.

## Open call

Switch to build mode and I'll execute the whole thing in one pass. If you'd rather I trim scope (e.g. skip the Brand native page and only ship the HTML backup), say so first.