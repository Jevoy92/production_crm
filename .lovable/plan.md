# Unified Calendar + Photo-to-Video Workflow

## 1. Extend the CC data model
**`src/lib/ccStore.ts`**
- Add to `ContentItem`: `publishDate?: string` (YYYY-MM-DD), `platform?: "Instagram" | "TikTok" | "YouTube" | "Web" | "Email" | "LinkedIn"`, `publishStatus?: "Draft" | "Scheduled" | "Published"`.
- Add new type `PhotoAsset` { id, title, photoUrl?, story, technicalBreakdown, voiceoverScript, stage: "Selected"|"Scripted"|"Recorded"|"Handoff"|"Published", linkedContentId? } and `photoAssets[]` slice.
- Actions: `setPublishDate(id, date)`, `setPlatform(id, platform)`, `clearPublishDate(id)`, plus photo asset CRUD + `promotePhotoToLibrary(id)` that creates a `ContentItem` of type "Photo-to-Video".

## 2. Upgrade `/schedule` into the unified calendar
**`src/routes/schedule.tsx`**
- Add view toggle in header: **Shoots · Publishing · All** (persist in `?view=` search param).
- Keep existing month grid; each cell now layers:
  - Shoot chips (existing) — click → `/cc/shoots/$id` or existing shoot detail.
  - Publish chips (new) — color-coded by platform, click opens a side drawer with title, platform, status, link to Core 12 / library entry.
- **Drag-and-drop** (native HTML5):
  - Drag a publish chip from one day to another → `setPublishDate`.
  - Drag from the **Unscheduled queue** sidebar onto any day.
  - Drag a publish chip back to the queue to clear its date.
- Right-rail sidebar: "Unscheduled" list of `contentItems` with no `publishDate`, filterable by platform/lane.
- Legend strip showing platform colors.

**New components**
- `src/components/schedule/PublishChip.tsx` — draggable chip, platform color, status dot.
- `src/components/schedule/UnscheduledQueue.tsx` — drop target sidebar.
- `src/components/schedule/ViewToggle.tsx` — shoots/publishing/all switcher.

## 3. Platform color tokens
**`src/styles.css`** — add:
```
--platform-instagram, --platform-tiktok, --platform-youtube,
--platform-web, --platform-email, --platform-linkedin
```
in oklch, with matching `*-foreground` where chip text needs contrast.

## 4. Surface in CC navigation
- **`src/components/cc/CCNav.tsx`** — add two tabs: **Calendar** (→ `/schedule?view=publishing`) and **Photo-to-Video** (→ `/cc/photo-to-video`).
- **`src/routes/cc.tsx`** — add a "This week publishing" strip above Core 12 snapshot, listing the next 7 days of scheduled publishes.

## 5. New page: Photo-to-Video workflow
**`src/routes/cc.photo-to-video.tsx`**
- Header: batch progress bar (Selected → Scripted → Recorded → Handoff → Published).
- Two-pane layout:
  - **Left:** photo asset grid (cards with thumbnail placeholder, title, current stage badge). "Add photo asset" button.
  - **Right:** selected asset editor with fields:
    - Photo URL / upload placeholder
    - Story beats (textarea)
    - Technical breakdown (textarea)
    - Jevoy's voiceover script (textarea)
    - Stage pipeline (segmented control)
    - "Promote to Library" button (active at Handoff/Published) → calls `promotePhotoToLibrary`, creates linked `ContentItem`.
- Seed 3–5 example photo assets so the page isn't empty.

## 6. Files touched / created
**Edit**
- `src/lib/ccStore.ts`
- `src/routes/schedule.tsx`
- `src/styles.css`
- `src/components/cc/CCNav.tsx`
- `src/routes/cc.tsx`

**Create**
- `src/components/schedule/PublishChip.tsx`
- `src/components/schedule/UnscheduledQueue.tsx`
- `src/components/schedule/ViewToggle.tsx`
- `src/routes/cc.photo-to-video.tsx`

## Technical notes
- DnD: native `draggable` + `onDragStart/onDragOver/onDrop` (no extra deps). Store `contentItem.id` in `dataTransfer`.
- All state lives in the existing Zustand `ccStore` (persisted to localStorage) — no schema/backend changes.
- `?view=` search param read with `useSearch` for shareable calendar views.
- No changes to existing shoot data, routes, or `/cc/shoots`.
