# Production OS — Palmer House

The production studio operating system: today dashboard, content engine (5-venture AI),
productions pipeline, schedule + Google Calendar, tasks + Focus Mode time tracking,
clients, finance, gear, checklists, playbooks.

> **Doing ANY UI work? Read [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) first.**
> It contains the locked design rules: banned patterns (no colored accent strips on
> cards), chart detail requirements (numbers/axes/labels on every visual), the motion
> and density vocabulary, theme tokens, and the shared primitives to reuse.

## Stack

- TanStack Start (React 19 + Vite), Tailwind v4 (`src/styles.css` tokens, dark + light)
- Zustand stores synced via Supabase `workspace_state` (`src/lib/cloudSync.ts`)
- AI: Lovable AI Gateway (`LOVABLE_API_KEY`) — Studio chat, Pals assistant,
  content engine (`src/lib/contentEngine.functions.ts`, 5-venture brain in
  `src/lib/ventures/`)
- Env: see `.env.example`
