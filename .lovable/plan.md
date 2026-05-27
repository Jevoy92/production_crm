## Script Studio

A new `/studio` route where you generate, edit, and save scripts in a Word-like editor with an AI assistant in a side panel that edits the open script as you talk.

### Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  Top bar: [Script title] [Brand ▾] [Save] [Export .md/.docx]│
├──────────────────────────────────────┬──────────────────────┤
│  Toolbar: B I U  H1 H2  • 1.  " <>   │  AI Assistant        │
│ ┌──────────────────────────────────┐ │  ────────────────    │
│ │                                  │ │  [chat transcript]   │
│ │   Tiptap WYSIWYG editor          │ │                      │
│ │   (the script body)              │ │  • Rewrite hook      │
│ │                                  │ │  • Tighten section   │
│ │                                  │ │  • Generate new      │
│ └──────────────────────────────────┘ │  [prompt input ▶]    │
│  Left rail: "My Scripts" list        │                      │
└──────────────────────────────────────┴──────────────────────┘
```

Left rail lists saved scripts (new / rename / delete). Center is the editor. Right side panel is the AI chat.

### Editor

- Tiptap with StarterKit + Underline + Link + Placeholder.
- Toolbar: bold, italic, underline, H1/H2/H3, bullet/numbered list, blockquote, code, undo/redo.
- Autosave (debounced 1s) into Lovable Cloud.
- Export buttons: `.md` (via turndown) and `.docx` (via `docx` package built client-side).

### AI assistant (side panel)

- Chat UI using AI Elements components (`Conversation`, `Message`, `MessageResponse`, `PromptInput`, `Shimmer`).
- Two affordances on every assistant message: **Insert** (append at cursor) and **Replace script** (swap full body). The model is instructed to return clean markdown the editor can convert to HTML.
- Quick actions above the composer: "Generate full script from idea", "Tighten current draft", "Rewrite hook", "Convert to [brand] voice".
- Chat history persists per script.

### Master prompt

System prompt is auto-assembled on the server from existing repo files:
- `src/content/scripts/Strategy/Cross-Venture Master Brief.md`
- `src/content/scripts/Strategy/YourBoyJevoy - Content Strategy Engine.md`
- `src/content/scripts/Strategy/Palmer House - The Investigative Universe.md`
- `src/content/scripts/Skills/jevoy-palmer-operating-manual/SKILL.md` (+ its `references/*.md`)

Plus the current script's brand, title, and current body are injected as context each turn. No settings UI yet — defaults are loaded from the files, which you already edit directly.

### Data model (Lovable Cloud)

```text
scripts
  id uuid pk, user_id uuid, title text, brand text,
  body_html text, body_md text, created_at, updated_at

script_messages
  id uuid pk, script_id uuid fk, user_id uuid,
  role text ('user'|'assistant'), content text, created_at
```

RLS: each user reads/writes only their own rows. Auth: email/password + Google (Lovable Cloud defaults).

### Technical details

- **Stack additions**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `turndown`, `marked`, `docx`, `file-saver`, AI Elements components (`conversation`, `message`, `prompt-input`, `shimmer`).
- **Backend**: enable Lovable Cloud; create `scripts` + `script_messages` tables with grants + RLS; add `/api/chat` server route using AI SDK (`streamText`, `google/gemini-3-flash-preview`) that loads the master-prompt files at server boot and persists the assistant turn in `onFinish`.
- **Server fns** (`src/lib/studio.functions.ts`): `listScripts`, `getScript`, `createScript`, `updateScript`, `deleteScript`, `listMessages` — all `requireSupabaseAuth`.
- **Routes**:
  - `src/routes/studio.tsx` — layout (left rail + outlet), redirects `/studio` → newest or new script.
  - `src/routes/studio.$id.tsx` — editor + chat panel for one script.
- **Sidebar**: add "Script Studio" entry to `src/components/dashboard/Sidebar.tsx`.
- **Auth**: a `/login` page if not already present, plus `_authenticated` wrap for `/studio/*`.

### Out of scope (ask before adding)

- Real-time collaboration / multi-user editing.
- Versioning / diff history.
- Pushing edits back into the bundled `src/content/scripts/**` files.
- A settings UI for editing the master prompt (files remain the source of truth).
