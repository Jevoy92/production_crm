## Goal

Give every video script a companion **Research Pack** view: a structured collection of study cards, supporting links, visuals/screenshots, scraped reference media, and a shot-list checklist — so when it's time to film/edit you can scan everything supporting that video in one place.

Starting content: the full "Judged Before You Speak" pack you pasted, attached to that theme (visible under JP, PH, and MYB tabs).

## What you'll see in the app

On each script page (`/scripts/$num`) a new **"Research & B-roll"** tab next to the existing script body. Inside:

1. **Header strip** — theme title, optional Drive folder link, "How to use" + "Delivery rule" callouts.
2. **Study cards** (one per numbered study) — each card shows:
  - SAY block (the spoken analogy, big quote style)
  - CARD block (citation, on-screen text)
  - LINK button → opens source
  - VISUAL description + an **asset gallery** (thumbnails of screenshots/clips you've collected)
  - "Add asset" button → upload image/video or paste a URL, with a caption
3. **Non-study visuals** — emotional beats listed as smaller cards with the same asset gallery.
4. **Shot-list checklist** — interactive checkboxes, progress bar, persists per script.
5. **Quick capture bar** — drag-drop a file or paste a URL anywhere on the page; pick which card it belongs to.

## How content is structured

A new content type lives alongside scripts:

```text
src/content/research/
  _manifest.json                 # theme_no → research pack file
  judged-before-you-speak.md     # the pack you pasted, in a structured MD/MDX format
  ...future packs
```

Parser turns each pack into typed sections (`StudyCard`, `VisualBeat`, `ShotListItem`) consumed by the new tab. The "Judged Before You Speak" pack ships seeded with all 8 studies + non-study visuals + checklist exactly as you wrote them.

## How assets are stored

- **Uploaded files** (screenshots, short clips) → Lovable Cloud Storage bucket `script-research` (private, RLS: authenticated users on the workspace can read/write). Each asset row links to `theme_no` + `card_id` + optional caption + source URL.
- **Pasted URLs** (YouTube, articles, Drive links) → stored as link-only asset rows with auto-fetched OG thumbnail/title via a small server function.
- Checklist state stored per user per theme.

Schema (new tables, all in `public` with proper GRANTs + RLS):

- `research_assets` — id, theme_no, card_id, kind (`image`|`video`|`link`), storage_path, source_url, caption, og_title, og_image, created_by, created_at
- `research_checklist` — id, theme_no, item_key, checked, user_id

## Build order

1. Create `src/content/research/judged-before-you-speak.md` with the pack, plus a typed parser in `src/lib/researchPacks.ts`.
2. New DB migration: `research_assets`, `research_checklist`, storage bucket, RLS + GRANTs.
3. Server functions: `listResearchAssets`, `addResearchAsset` (file upload + URL ingest with OG fetch), `deleteResearchAsset`, `toggleChecklistItem`.
4. New component `ResearchPack.tsx` (cards, galleries, checklist, quick capture).
5. Wire into `src/routes/scripts.$num.tsx` as a tab; show a small badge ("Research" / asset count) on the script list row in `src/routes/scripts.tsx`.
6. Verify on the "Judged Before You Speak" theme end-to-end (upload, link paste, checklist).

## A few choices for you

1. **Scope of first build** — ship the full system (DB + uploads + URL ingest + checklist) for all scripts, with only "Judged Before You Speak" pre-populated? Or start read-only (cards + checklist only, no uploads yet) and add uploads in a second pass?- add all things including uploads
  &nbsp;
2. **Drive integration** — no drive integration I want it visually represented with beautiful layouts and fformatting and video playback and photo viewing and all the good stuff
3. **Who can upload** — anyone