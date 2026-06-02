## Pals — Floating AI Assistant Overlay

Build an always-available AI assistant ("Pals") that knows the entire Palmer House workspace and can take real actions on it. Scope is strictly the assistant — no Today/Tasks/Content refactors this turn. The doc gaps you listed go in a follow-up.

### Surface

- Floating launcher pinned bottom-right, visible on every authenticated page (mounted inside `AppShell`).
- Click → side drawer (right, ~420px, full height) with chat. Esc / outside click closes.
- Header: "Pals", model badge, "New conversation" (clears history after confirm), close.
- Built on AI Elements primitives (`Conversation`, `Message`, `MessageResponse`, `PromptInput`, `Tool`, `Shimmer`). No `Sparkles` mascot — use a small custom Pals avatar.
- Composer auto-focuses on open, after send, after stream completes.

### Memory — DB single rolling conversation

One shared conversation (matches the app's single-workspace model, like `workspace_state`).

New table `pals_messages`:
- `id uuid pk`, `role text` ('user'|'assistant'|'system'), `parts jsonb` (full AI SDK `UIMessage.parts`), `created_at timestamptz`
- RLS: authenticated read/insert/delete; service_role all
- Loaded on first drawer open, then kept in `useChat` state and persisted in `onFinish`

"New conversation" deletes all rows after a confirm.

### Model & gateway

- Lovable AI Gateway via `@ai-sdk/openai-compatible` using existing `ai-gateway.ts` pattern (`LOVABLE_API_KEY` already set).
- Default model: `google/gemini-3-pro-preview` (latest, strongest reasoning + tool use). Falls back to `google/gemini-3-flash-preview` on rate limit.
- Streaming via `streamText` + `toUIMessageStreamResponse`.

### Server route

`src/routes/api/pals.ts` — POST streaming chat endpoint.

Flow per request:
1. Validate body (`{ messages: UIMessage[] }`).
2. Build a fresh **workspace snapshot** server-side by reading `workspace_state` (the shared zustand sync row) + `pals_messages`. Inject as a system message summarizing: counts, today's date, upcoming shoots, open tasks per owner, content by status, Core 12 script statuses, blocked items.
3. Call `streamText` with tools (below) and `stopWhen: stepCountIs(50)`.
4. `toUIMessageStreamResponse({ originalMessages, onFinish })` — persist new user msg + final assistant msg to `pals_messages`.
5. Wrap with `withLovableAiGatewayRunIdHeader` for log correlation.

### Tools (full write access, with confirmation gating)

All tools defined with `tool({ inputSchema: z…, execute })`. Tools that mutate use `needsApproval: true` so the user clicks "Approve" inline before it runs.

Read tools (no approval):
- `searchWorkspace({ query, kinds? })` — fuzzy search across content, scripts, Core 12, shoots, tasks, clients
- `getEntity({ kind, id })`
- `listTasks({ owner?, due?, status? })`
- `listContent({ filter? })`
- `getTodayBrief()` — derived summary

Write tools (`needsApproval: true`):
- `createTask({ title, owner, dueDate?, category?, relatedContentId?, relatedShootId? })`
- `updateTask({ id, patch })` / `completeTask({ id })`
- `createContentItem({ title, type, platform, palLane, businessPurpose, cta, relatedCore12? })`
- `updateContentItem({ id, patch })` — status, dates, fileLocation, caption, etc.
- `createShoot({ date, location, theme, videos })` / `updateShoot({ id, patch })`
- `updateCore12({ number, patch })` — set status, mark scriptDone/filmedDone/etc., add notes
- `scheduleContent({ id, publishDate, platform })`
- `generateSupportingShorts({ scriptNum })` — invokes existing `repurpose.functions.ts`
- `addChecklistItem` / `toggleChecklistItem`

All write tools execute against the same zustand-backed `workspace_state` row via a server helper, then the client re-syncs (the existing `cloudSync` listener picks up the version bump).

Tool UI renders via AI Elements `<Tool defaultOpen={false}>` — collapsed by default, expand to see input/output, approve button inline for pending writes.

### System prompt

Detailed system prompt covering:
- Pals is the Palmer House Productions ops assistant for Jevoy and Shannen
- Workspace structure (Core 12, Scripts, Productions, Content, Tasks, Schedule, Library)
- Owner conventions (Jevoy = creative/film/approve; Shannen = prep/organize/handoff/publish)
- Always propose action via the right tool rather than instructing the user to click
- For destructive/mutating actions, confirm intent first then call the tool (which itself requires approval)
- Markdown formatting allowed

### Files

New:
- `supabase/migrations/<ts>_pals_messages.sql` — table + RLS + grants
- `src/routes/api/pals.ts` — streaming chat route with tools
- `src/lib/pals.tools.ts` — tool definitions (shared types)
- `src/lib/pals.snapshot.server.ts` — workspace snapshot builder
- `src/lib/pals.actions.server.ts` — server-side mutators against `workspace_state`
- `src/components/pals/PalsLauncher.tsx` — floating bubble
- `src/components/pals/PalsDrawer.tsx` — drawer + `useChat` + AI Elements composition
- `src/components/pals/PalsToolCard.tsx` — custom rendering for known tool results
- `src/assets/pals-avatar.png` — generated identity mark

Modified:
- `src/components/app/AppShell.tsx` — mount `<PalsLauncher />`
- AI Elements install: `bun x ai-elements@latest add conversation message prompt-input shimmer tool`

### Out of scope (explicit)

- No changes to Today, Tasks, Content, Core 12, Productions, Schedule pages
- No new sidebar item (overlay only, per choice)
- No multi-thread UI
- No voice / file attachments
- No image generation

### Verify before done

- Open drawer on `/`, `/content`, `/schedule` — bubble present, chat opens
- Ask "what's on for today?" — Pals reads snapshot, replies
- Ask "add a task for Shannen to prep teleprompter notes for tomorrow" — tool call shows in chat, Approve → task appears on `/tasks`
- Reload page → chat history restored from DB
- "New conversation" wipes history
