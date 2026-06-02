## Goal

Make Pals genuinely useful for content work: it should *know every script you have*, brainstorm new video ideas, draft full long-form scripts, and continue to spin up the 3 supporting shorts from any long-form.

## What changes

### 1. Pals snapshot — include full script bodies
Extend the workspace snapshot the server builds before each model call to include every row from `studio_scripts`: `id`, `title`, `brand`, `updated_at`, and full `body_md`. Pals can now quote, summarize, critique, and reference scripts by name.

Guardrails:
- Cap bodies at ~8k chars each in the snapshot (truncate with a marker). Full long-form rarely exceeds this; if it does, Pals can ask for the rest via a follow-up tool later.
- Sort by `updated_at desc` so the most recent work is most prominent.

### 2. New tool: `brainstormIdeas`
Pals proposes N video ideas (default 5). Each idea: `title`, `hook`, `angle`, `pillar` (Core 12 reference), `format` (long | short). Approval-gated. On approve, ideas are saved as **content items** with `type: "idea"` (or the closest existing type) into the existing content library — no new table.

### 3. New tool: `generateLongFormScript`
Inputs: `title`, `brand` (`jevoy` | default), `outline` or `topic`, optional `pillar`. Pals drafts a full long-form script (hook → body → CTA) and on approval inserts a new row into `studio_scripts`. Returns the new `script_id` so the user (or Pals) can immediately run `generateSupportingShorts` on it.

### 4. Keep existing `generateSupportingShorts`
No change — already auto-saves the 3 shorts to Library. Pals now has the long-form bodies in context, so it can pick a script by title without you pasting it.

### 5. System prompt update
Add a short section: "You can see every script in the Scripts library. You can brainstorm ideas, draft new long-form scripts, and generate 3 supporting shorts for any long-form. Always propose via the right tool — never paste a full script into chat as the only output."

## Files touched

- `src/routes/api/pals.ts` — extend snapshot builder to fetch `studio_scripts`, inject into system prompt; update system prompt text.
- `src/lib/pals.tools.ts` — add `brainstormIdeas` and `generateLongFormScript` schemas; add both to `WRITE_TOOL_NAMES`.
- `src/lib/pals.executor.ts` — client-side executors:
  - `brainstormIdeas` → push N items into content store as ideas
  - `generateLongFormScript` → insert into `studio_scripts` via supabase client, refresh local script list
- No DB migration needed (reusing `studio_scripts` and existing content items).

## Out of scope

- New `script_ideas` table (you chose content-items-only)
- Multi-thread chat, voice, file upload
- Editing existing script bodies via Pals (read-only for now; can add `updateScript` in a follow-up if you want)
- Any page/sidebar/UI restructuring

## Acceptance

- Open Pals, ask "what scripts do I have?" → it lists titles + brands accurately.
- Ask "give me 5 ideas for Jevoy around [topic]" → proposes 5, approve → they appear in Content library as ideas.
- Ask "draft a long-form on [topic]" → proposes script, approve → new row in Scripts library.
- Ask "make 3 shorts for [script title]" → existing repurpose flow runs, 3 shorts saved to Library.
