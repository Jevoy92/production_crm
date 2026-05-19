import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Project,
  Client,
  TeamMember,
  Shoot,
  PlaybookPage,
  GearItem,
  GearKit,
  Asset,
  ChecklistStage,
  Stage,
  PalType,
  Task,
  ChecklistTemplates,
  ContentPiece,
  ContentPipelineStage,
  TrackedKpi,
} from "./types";
import { SEED, buildChecklistsFromTemplate, DEFAULT_TEMPLATES } from "./seed";

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

type Role = "owner" | "cfo" | "pa";

type State = {
  // session
  activeRole: Role;
  setRole: (r: Role) => void;

  // data
  team: TeamMember[];
  clients: Client[];
  projects: Project[];
  shoots: Shoot[];
  playbook: PlaybookPage[];
  gearItems: GearItem[];
  gearKits: GearKit[];
  assets: Asset[];
  tasks: Task[];
  templates: ChecklistTemplates;
  contentPieces: ContentPiece[];
  trackedKpis: TrackedKpi[];

  // manual KPI inputs (Adrienne CFO)
  finance: {
    cashCollectedMonth: number;
    outstanding: number;
    toolSpend: number;
    aiSpend: number;
    contractorSpend: number;
    bookedMonth: number;
    bookedQuarter: number;
    retainerRevenue: number;
    ar30: number;
    ar60: number;
    ar90: number;
  };
  setFinance: (patch: Partial<State["finance"]>) => void;

  // mutations
  addProject: (
    p: Partial<Project> & Pick<Project, "title" | "clientId" | "palType" | "ownerId">,
  ) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setStage: (id: string, stage: Stage) => void;
  toggleChecklistItem: (projectId: string, stage: ChecklistStage, itemId: string) => void;
  addChecklistItem: (projectId: string, stage: ChecklistStage, text: string) => void;
  addLogEntry: (
    projectId: string,
    who: string,
    type: Project["log"][number]["type"],
    text: string,
  ) => void;

  addClient: (c: Omit<Client, "id">) => string;
  updateClient: (id: string, patch: Partial<Client>) => void;
  removeClient: (id: string) => void;

  addMember: (m: Omit<TeamMember, "id">) => string;
  updateMember: (id: string, patch: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;

  addShoot: (s: Omit<Shoot, "id">) => string;
  updateShoot: (id: string, patch: Partial<Shoot>) => void;
  removeShoot: (id: string) => void;

  upsertPlaybookPage: (p: PlaybookPage) => void;
  removePlaybookPage: (slug: string) => void;

  addGearItem: (g: Omit<GearItem, "id">) => string;
  updateGearItem: (id: string, patch: Partial<GearItem>) => void;
  removeGearItem: (id: string) => void;

  addGearKit: (k: Omit<GearKit, "id">) => string;
  updateGearKit: (id: string, patch: Partial<GearKit>) => void;
  removeGearKit: (id: string) => void;

  addAsset: (a: Omit<Asset, "id" | "updatedAt">) => string;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  addTask: (t: Omit<Task, "id" | "createdAt">) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  setTemplate: (pal: PalType, stage: ChecklistStage, items: string[]) => void;
  resetTemplates: () => void;

  addContentPiece: (p: Omit<ContentPiece, "id" | "createdAt">) => string;
  updateContentPiece: (id: string, patch: Partial<ContentPiece>) => void;
  removeContentPiece: (id: string) => void;
  setContentStage: (id: string, stage: ContentPipelineStage) => void;
  toggleRepurposableClip: (pieceId: string, clipId: string) => void;

  addKpi: (p: Omit<TrackedKpi, "id" | "createdAt">) => void;
  updateKpi: (id: string, patch: Partial<TrackedKpi>) => void;
  removeKpi: (id: string) => void;

  resetData: () => void;
  clearSeedData: () => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      activeRole: "owner",
      setRole: (r) => set({ activeRole: r }),

      team: SEED.team,
      clients: SEED.clients,
      projects: SEED.projects,
      shoots: SEED.shoots,
      playbook: SEED.playbook,
      gearItems: SEED.gearItems,
      gearKits: SEED.gearKits,
      assets: SEED.assets,
      tasks: SEED.tasks,
      templates: SEED.templates,
      contentPieces: SEED.contentPieces,
      trackedKpis: SEED.trackedKpis,

      finance: {
        cashCollectedMonth: 64200,
        outstanding: 28400,
        toolSpend: 1280,
        aiSpend: 340,
        contractorSpend: 8600,
        bookedMonth: 84500,
        bookedQuarter: 218400,
        retainerRevenue: 12000,
        ar30: 18400,
        ar60: 6200,
        ar90: 3800,
      },
      setFinance: (patch) => set({ finance: { ...get().finance, ...patch } }),

      addProject: (p) => {
        const id = uid("p");
        const project: Project = {
          id,
          title: p.title,
          clientId: p.clientId,
          internal: p.internal ?? false,
          palType: p.palType,
          stage: p.stage ?? "Lead",
          ownerId: p.ownerId,
          shootDate: p.shootDate,
          deliveryDate: p.deliveryDate,
          quoted: p.quoted,
          cost: p.cost,
          driveLink: p.driveLink,
          honeybookLink: p.honeybookLink,
          reviewLink: p.reviewLink,
          notes: p.notes,
          priority: p.priority ?? "Med",
          blocker: p.blocker,
          checklists: p.checklists ?? buildChecklistsFromTemplate(get().templates, p.palType),
          log: p.log ?? [],
          createdAt: new Date().toISOString(),
        };
        set({ projects: [project, ...get().projects] });
        return id;
      },
      updateProject: (id, patch) =>
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      removeProject: (id) =>
        set({
          projects: get().projects.filter((p) => p.id !== id),
          shoots: get().shoots.filter((s) => s.projectId !== id),
          assets: get().assets.filter((a) => a.projectId !== id),
        }),
      setStage: (id, stage) => get().updateProject(id, { stage }),

      toggleChecklistItem: (projectId, stage, itemId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const items = project.checklists[stage].map((i) =>
          i.id === itemId ? { ...i, done: !i.done } : i,
        );
        get().updateProject(projectId, { checklists: { ...project.checklists, [stage]: items } });
      },
      addChecklistItem: (projectId, stage, text) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const items = [...project.checklists[stage], { id: uid("ci"), text, done: false }];
        get().updateProject(projectId, { checklists: { ...project.checklists, [stage]: items } });
      },
      addLogEntry: (projectId, who, type, text) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        const log = [
          { id: uid("lg"), ts: new Date().toISOString(), who, type, text },
          ...project.log,
        ];
        get().updateProject(projectId, { log });
      },

      addClient: (c) => {
        const id = uid("c");
        set({ clients: [{ id, ...c }, ...get().clients] });
        return id;
      },
      updateClient: (id, patch) =>
        set({ clients: get().clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
      removeClient: (id) => set({ clients: get().clients.filter((c) => c.id !== id) }),

      addMember: (m) => {
        const id = uid("u");
        set({ team: [...get().team, { id, ...m }] });
        return id;
      },
      updateMember: (id, patch) =>
        set({ team: get().team.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
      removeMember: (id) => set({ team: get().team.filter((m) => m.id !== id) }),

      addShoot: (s) => {
        const id = uid("s");
        set({ shoots: [...get().shoots, { id, ...s }] });
        return id;
      },
      updateShoot: (id, patch) =>
        set({ shoots: get().shoots.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),
      removeShoot: (id) => set({ shoots: get().shoots.filter((s) => s.id !== id) }),

      upsertPlaybookPage: (p) =>
        set({
          playbook: get().playbook.find((x) => x.slug === p.slug)
            ? get().playbook.map((x) => (x.slug === p.slug ? p : x))
            : [p, ...get().playbook],
        }),
      removePlaybookPage: (slug) =>
        set({ playbook: get().playbook.filter((p) => p.slug !== slug) }),

      addGearItem: (g) => {
        const id = uid("g");
        set({ gearItems: [{ id, ...g }, ...get().gearItems] });
        return id;
      },
      updateGearItem: (id, patch) =>
        set({ gearItems: get().gearItems.map((g) => (g.id === id ? { ...g, ...patch } : g)) }),
      removeGearItem: (id) => set({ gearItems: get().gearItems.filter((g) => g.id !== id) }),

      addGearKit: (k) => {
        const id = uid("k");
        set({ gearKits: [...get().gearKits, { id, ...k }] });
        return id;
      },
      updateGearKit: (id, patch) =>
        set({ gearKits: get().gearKits.map((k) => (k.id === id ? { ...k, ...patch } : k)) }),
      removeGearKit: (id) => set({ gearKits: get().gearKits.filter((k) => k.id !== id) }),

      addAsset: (a) => {
        const id = uid("a");
        set({ assets: [{ id, updatedAt: new Date().toISOString(), ...a }, ...get().assets] });
        return id;
      },
      updateAsset: (id, patch) =>
        set({
          assets: get().assets.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
          ),
        }),
      removeAsset: (id) => set({ assets: get().assets.filter((a) => a.id !== id) }),

      addTask: (t) => {
        const id = uid("t");
        set({ tasks: [{ id, createdAt: new Date().toISOString(), ...t }, ...get().tasks] });
        return id;
      },
      updateTask: (id, patch) =>
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      removeTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
      toggleTaskStatus: (id) =>
        set({
          tasks: get().tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: t.status === "done" ? "todo" : t.status === "todo" ? "doing" : "done",
                }
              : t,
          ),
        }),

      setTemplate: (pal, stage, items) =>
        set({
          templates: { ...get().templates, [pal]: { ...get().templates[pal], [stage]: items } },
        }),
      resetTemplates: () => set({ templates: DEFAULT_TEMPLATES }),

      addContentPiece: (p) => {
        const id = uid("cp");
        const piece: ContentPiece = { id, createdAt: new Date().toISOString(), ...p };
        set({ contentPieces: [piece, ...get().contentPieces] });
        return id;
      },
      updateContentPiece: (id, patch) =>
        set({ contentPieces: get().contentPieces.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      removeContentPiece: (id) =>
        set({ contentPieces: get().contentPieces.filter((p) => p.id !== id) }),
      setContentStage: (id, stage) => get().updateContentPiece(id, { stage }),
      toggleRepurposableClip: (pieceId, clipId) => {
        const piece = get().contentPieces.find((p) => p.id === pieceId);
        if (!piece) return;
        const clips = piece.repurposableClips.map((c) =>
          c.id === clipId ? { ...c, done: !c.done } : c
        );
        get().updateContentPiece(pieceId, { repurposableClips: clips });
      },

      addKpi: (p) =>
        set({
          trackedKpis: [
            ...get().trackedKpis,
            { id: uid("kpi"), createdAt: new Date().toISOString(), ...p },
          ],
        }),
      updateKpi: (id, patch) =>
        set({
          trackedKpis: get().trackedKpis.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        }),
      removeKpi: (id) => set({ trackedKpis: get().trackedKpis.filter((k) => k.id !== id) }),

      resetData: () =>
        set({
          team: SEED.team,
          clients: SEED.clients,
          projects: SEED.projects,
          shoots: SEED.shoots,
          playbook: SEED.playbook,
          gearItems: SEED.gearItems,
          gearKits: SEED.gearKits,
          assets: SEED.assets,
          tasks: SEED.tasks,
          templates: SEED.templates,
          contentPieces: SEED.contentPieces,
          trackedKpis: SEED.trackedKpis,
          finance: {
            cashCollectedMonth: 64200,
            outstanding: 28400,
            toolSpend: 1280,
            aiSpend: 340,
            contractorSpend: 8600,
            bookedMonth: 84500,
            bookedQuarter: 218400,
            retainerRevenue: 12000,
            ar30: 18400,
            ar60: 6200,
            ar90: 3800,
          },
        }),
      clearSeedData: () =>
        set({
          clients: [],
          projects: [],
          shoots: [],
          playbook: [],
          gearItems: [],
          gearKits: [],
          assets: [],
          tasks: [],
          contentPieces: [],
          trackedKpis: [],
          finance: { cashCollectedMonth: 0, outstanding: 0, toolSpend: 0, aiSpend: 0, contractorSpend: 0, bookedMonth: 0, bookedQuarter: 0, retainerRevenue: 0, ar30: 0, ar60: 0, ar90: 0 },
        }),
    }),
    {
      name: "phpos:v2",
      version: 11,
      // Migrate persisted state forward without nuking the user's own data.
      // v11 ships the rebuilt playbook seed (tables, callouts, Pal characters)
      // — overwrite just `playbook`; projects/clients/finance stay intact.
      migrate: (persisted: any, fromVersion) => {
        if (!persisted) return persisted;
        if (fromVersion < 11) {
          persisted.playbook = SEED.playbook;
        }
        return persisted;
      },
    },
  ),
);

// derived helpers
export const palColor = (p: PalType) =>
  p === "Visibility"
    ? "#F26522"
    : p === "Systems"
      ? "#5C2A82"
      : p === "YouTube"
        ? "#8FA892"
        : "#111111";

export const stageOrder = (s: Stage) =>
  [
    "Lead",
    "Strategy Call",
    "Proposal Sent",
    "Booked",
    "Pre-Production",
    "Shoot Day",
    "In Post",
    "Delivered",
    "Archived",
  ].indexOf(s);

export function checklistProgress(p: Project): { done: number; total: number; pct: number } {
  let done = 0,
    total = 0;
  (Object.keys(p.checklists) as ChecklistStage[]).forEach((k) => {
    p.checklists[k].forEach((i) => {
      total++;
      if (i.done) done++;
    });
  });
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function readinessScore(p: Project): number {
  // weighted: pre 50%, gear flag (driveLink) 15%, shoot date set 10%, owner 10%, client info 15%
  const pre = p.checklists["Pre-Production"];
  const preDone = pre.filter((i) => i.done).length;
  const prePct = pre.length ? preDone / pre.length : 0;
  const hasDrive = p.driveLink ? 1 : 0;
  const hasShoot = p.shootDate ? 1 : 0;
  const hasOwner = p.ownerId ? 1 : 0;
  const hasClient = p.clientId ? 1 : 0;
  return Math.round(
    (prePct * 0.5 + hasDrive * 0.15 + hasShoot * 0.1 + hasOwner * 0.1 + hasClient * 0.15) * 100,
  );
}
