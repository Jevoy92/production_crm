# Palmer House Production OS — Gap-Fill Plan

Three workstreams. No code in this turn.

---

## 1. Make `/gear` more visual

Today it's a flat list of rows. Reference screenshot shows a card grid with images, status pills, and a kit sidebar — let's match that.

Changes to `src/routes/gear.tsx`:

- **Top stat row** — keep 3 KPI cards (Available / On Shoot / Repair), but add a 4th: **Utilization %** = OnShoot / Total. Icon tints match status color.
- **Inventory grid (replaces list)**
  - 3-column responsive card grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).
  - Each card: square image area with neutral surface bg, status pill top-right, category icon + label bottom-left, item name, and a "View details" subtle button (opens Edit modal).
  - Add optional `imageUrl?: string` to `GearItem` type. Seed cameras/lens/audio/light/support items with curated Unsplash URLs (or category-fallback icon rendered large when no image).
- **Filters bar** above the grid: category chips (All / Camera / Lens / Audio / Lighting / Support / Media / Monitor) + status chips. Click to filter.
- **Kits column** (right rail on xl, full width below on smaller): each kit becomes a richer card showing the first 3 item thumbnails stacked + "+N more", use case line, and a "Pack list" expand. Add **New Kit** button (currently the "+ New Kit" link in the screenshot doesn't exist in code).
- Keep Edit/Delete actions but move them into a hover overflow menu (⋯) on each card to keep the visuals clean.

No business-logic change beyond adding `imageUrl` and a `createKit`/`updateKit` action to the store.

---

## 2. Add the missing KPI layer (the biggest gap vs. the MD)

The MD is explicit: **three roles, three homepages**, each with their own KPI screen. Today `/analytics` exists as a single role-switched chart page, but there are no dedicated KPI routes and many of the spec's metrics aren't shown. Fix:

### New routes

```
/kpis/owner   → Jevoy dashboard
/kpis/cfo     → Adrienne dashboard
/kpis/pa      → Production Assistant dashboard
```

Sidebar gets a "KPIs" group with these three entries (visible to all, but the active role's KPI page is also what `/` redirects to after role switch — see §3).

### Jevoy / Owner KPIs (from MD)

Cards + small charts, derived from store:

- Active projects by Pal type (donut)
- Total quoted value of active projects
- Booked revenue this month / quarter (manual input, store-backed)
- Avg days lead → booked (computed from `log` timestamps when stage moves)
- Strategy calls booked / Proposals sent / Projects booked (counters from stage history)
- Deliverables shipped this month (count of projects entering "Delivered" this month)
- Deliverables shipped by Pal type (bar)
- Shoot days this month vs. capacity (progress)
- Internal videos created (count where `internal === true`)
- Playbook pages created (count)
- "What's stuck" panel — projects with `blocker` set or no stage change in 14 days

### Adrienne / CFO KPIs

- Cash collected this month (manual, already in `finance`)
- Outstanding invoices (manual)
- Booked revenue (sum of quoted on Booked+)
- Recurring/retainer revenue (new manual field on Client: `retainerMonthly?`)
- Avg project margin by Pal type (bar) — from quoted − cost
- Top 5 clients by lifetime value (sum of project quoted per client)
- Aged AR 30/60/90+ (manual entry, three new finance fields)
- Tool / AI credit / contractor spend (already exist)
- Data hygiene: projects missing quoted, projects missing cost (already on `/finance`, mirror here)

### PA KPIs

- Open tasks assigned to PA (need a lightweight Task model — see §3)
- Upcoming shoots this week
- Readiness score per shoot = % of Pre-Prod checklist done for the linked project
- % checklists completed on time (vs. shootDate)
- Pre-prod items overdue
- Days-to-delivery vs. promised
- Asset folders organized (count of projects with `driveLink` set)
- Blockers resolved this week (from log)

### Implementation notes

- One `src/components/kpi/` folder with small reusable primitives: `KpiCard`, `KpiBar`, `KpiDonut`, `KpiList`, `KpiProgress`.
- All numbers derived via selectors in `src/lib/kpis.ts` (pure functions over store state) so each KPI page is just composition.
- Where the MD asks for manual entries that don't exist yet, extend `finance` slice: `bookedMonth`, `bookedQuarter`, `retainerRevenue`, `ar30`, `ar60`, `ar90`. Inputs live on `/finance` and the CFO KPI page.

---

## 3. Other spec gaps to close

Audit of what the MD calls for vs. what currently exists:

| Spec area                                           | Status                    | Action                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| `/login` with 3 accounts                            | ❌ none                   | Out of scope for this plan — role-switcher in Topbar already covers the MVP intent. Flag as Phase 2.                                                                                                                                                                                                         |
| `/dashboard` role-routed homepage                   | ⚠️ generic                | Make `/` (Overview) redirect to `/kpis/{activeRole}` so each user lands on their own dashboard, per the MD's "three roles, three homepages". Keep current Overview accessible at `/overview`.                                                                                                                |
| `/shoots/$id` mobile shoot-day view                 | ❌ missing                | Add route: big-type, single column — project, location, arrival, goals, shot list, gear list, Shoot Day checklist, wrap checklist, notes. Linked from Schedule and Project Hub.                                                                                                                              |
| `/clients` + `/clients/$id`                         | ❌ missing                | Add: list/table with company, contact, project count, LTV (sum of quoted), HoneyBook link. Detail page with notes, project history, manual `retainerMonthly`.                                                                                                                                                |
| `/admin/templates` checklist template editor        | ❌ missing                | Add: per-Pal × per-stage editable templates. Currently checklists are seeded per-project from `buildChecklists()` — refactor to read from store-backed `templates: Record<PalType, Record<ChecklistStage, string[]>>`, with a UI to add/remove/reorder items. New projects clone from the matching template. |
| `/admin/team`                                       | ✅ covered by `/team`     | Rename in sidebar to "Team" (already done).                                                                                                                                                                                                                                                                  |
| Task model (PA tasks, assignments)                  | ❌ missing                | Add `Task` type: `{ id, projectId?, title, assigneeId, dueDate?, status: "todo"                                                                                                                                                                                                                              | "doing" | "done", priority, stage? }`. New `/tasks` route (kanban or list) + "My tasks" widget on PA KPI page. |
| Activity log per project                            | ✅ exists (`project.log`) | Surface a global "Recent activity" feed on Owner KPI page.                                                                                                                                                                                                                                                   |
| Pal-specific checklist customization (16 templates) | ⚠️ partial                | Seed the 4 universal lists + the 4 per-Pal additions from the MD into the new template store.                                                                                                                                                                                                                |
| Playbook categories from MD                         | ⚠️ partial                | Ensure all 11 categories exist (Sales & Intake, Pre-Prod, Shoot Day, Post-Prod, Delivery, The Pals, Brand, AI Tools, File Management, Website & Content, Internal Training). Seed at least one page per category from the MD's page list.                                                                    |
| Readiness score                                     | ❌ missing                | Compute per shoot = % of project's Pre-Production checklist done. Show on Schedule cards and PA KPI.                                                                                                                                                                                                         |
| Blocker flag on pipeline cards                      | ⚠️ partial                | Card already shows priority; add red dot + blocker text tooltip when `project.blocker` is set.                                                                                                                                                                                                               |
| Gear kits CRUD                                      | ❌ read-only              | Add create/edit/delete for kits (covered in §1).                                                                                                                                                                                                                                                             |
| Image/thumbnail on gear                             | ❌                        | Add `imageUrl` (covered in §1).                                                                                                                                                                                                                                                                              |

---

## Suggested build order

1. **Gear visual refresh** (§1) — self-contained, 1 file + type tweak + store action.
2. **KPI selectors + 3 KPI routes** (§2) — biggest user-visible win, closes the loudest gap in the MD.
3. **Finance manual fields** (booked month/quarter, AR aging, retainer) wired into CFO KPI.
4. **Shoot-day mobile view** `/shoots/$id`.
5. **Clients module** `/clients` + `/clients/$id`.
6. **Template editor** `/admin/templates` + refactor seeding.
7. **Task model** + `/tasks` + PA "My tasks" widget.
8. **Playbook seeding** to cover all 11 MD categories.

Each step is independent and shippable on its own — happy to start with #1 and #2 together, or whichever you want to prioritize. I still dont see an edit button on the team page, please double check these basic things . I still dont see an edit button on the team page, please double check these basic things .
