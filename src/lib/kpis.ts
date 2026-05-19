import type { Project, Shoot, PalType, Stage } from "./types";
import { useStore } from "./store";
import { checklistProgress, readinessScore } from "./store";

const ACTIVE: Stage[] = [
  "Lead",
  "Strategy Call",
  "Proposal Sent",
  "Booked",
  "Pre-Production",
  "Shoot Day",
  "In Post",
];
const isActive = (p: Project) => ACTIVE.includes(p.stage);
const sameMonth = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
};
const sameWeek = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  const start = new Date(n);
  start.setDate(n.getDate() - n.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
};

// ---------- OWNER (Jevoy) ----------
export function ownerKpis() {
  const { projects, shoots, playbook } = useStore.getState();
  const active = projects.filter(isActive);

  const byPal = (k: PalType) => active.filter((p) => p.palType === k).length;
  const activeByPal: { name: PalType; value: number }[] = [
    { name: "Visibility", value: byPal("Visibility") },
    { name: "Systems", value: byPal("Systems") },
    { name: "YouTube", value: byPal("YouTube") },
    { name: "Commercial", value: byPal("Commercial") },
  ];

  const quotedTotal = active.reduce((a, p) => a + (p.quoted ?? 0), 0);

  const deliveredThisMonth = projects.filter(
    (p) => p.stage === "Delivered" && p.deliveryDate && sameMonth(p.deliveryDate),
  );
  const deliveredByPal: { name: PalType; value: number }[] = (
    ["Visibility", "Systems", "YouTube", "Commercial"] as PalType[]
  ).map((k) => ({ name: k, value: deliveredThisMonth.filter((p) => p.palType === k).length }));

  const stuck = projects.filter(
    (p) =>
      isActive(p) &&
      (p.blocker || Date.now() - new Date(p.createdAt).getTime() > 1000 * 60 * 60 * 24 * 14),
  );

  const shootsThisMonth = shoots.filter((s) => sameMonth(s.date)).length;
  const internalCount = projects.filter((p) => p.internal).length;

  return {
    activeCount: active.length,
    activeByPal,
    quotedTotal,
    deliveredThisMonth: deliveredThisMonth.length,
    deliveredByPal,
    shootsThisMonth,
    internalCount,
    playbookCount: playbook.length,
    stuck,
  };
}

// ---------- CFO (Adrienne) ----------
export function cfoKpis() {
  const { projects, clients, finance } = useStore.getState();

  const bookedRevenue = projects
    .filter((p) =>
      ["Booked", "Pre-Production", "Shoot Day", "In Post", "Delivered"].includes(p.stage),
    )
    .reduce((a, p) => a + (p.quoted ?? 0), 0);

  const marginByPal: { name: PalType; value: number }[] = (
    ["Visibility", "Systems", "YouTube", "Commercial"] as PalType[]
  ).map((k) => {
    const ps = projects.filter((p) => p.palType === k && p.quoted && p.cost);
    if (!ps.length) return { name: k, value: 0 };
    const m = ps.reduce((a, p) => a + ((p.quoted! - p.cost!) / p.quoted!) * 100, 0) / ps.length;
    return { name: k, value: Math.round(m) };
  });

  const topClients = clients
    .map((c) => ({
      name: c.company ?? c.name,
      value: projects.filter((p) => p.clientId === c.id).reduce((a, p) => a + (p.quoted ?? 0), 0),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const missingQuoted = projects.filter(
    (p) => !p.quoted && p.stage !== "Lead" && p.stage !== "Strategy Call",
  ).length;
  const missingCost = projects.filter(
    (p) => !p.cost && (p.stage === "Delivered" || p.stage === "In Post"),
  ).length;

  return {
    cashCollected: finance.cashCollectedMonth,
    outstanding: finance.outstanding,
    booked: bookedRevenue,
    retainer: finance.retainerRevenue,
    bookedMonth: finance.bookedMonth,
    bookedQuarter: finance.bookedQuarter,
    marginByPal,
    topClients,
    aging: [
      { name: "30d", value: finance.ar30 },
      { name: "60d", value: finance.ar60 },
      { name: "90d+", value: finance.ar90 },
    ],
    spend: [
      { name: "Tools", value: finance.toolSpend },
      { name: "AI", value: finance.aiSpend },
      { name: "Contractors", value: finance.contractorSpend },
    ],
    missingQuoted,
    missingCost,
  };
}

// ---------- PA ----------
export function paKpis() {
  const { projects, shoots } = useStore.getState();
  const now = new Date();
  const upcoming = shoots
    .filter((s) => new Date(s.date) >= new Date(now.toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcomingThisWeek = upcoming.filter((s) => sameWeek(s.date));

  const readiness = upcoming.slice(0, 6).map((s: Shoot) => {
    const p = projects.find((x) => x.id === s.projectId);
    return {
      shoot: s,
      project: p,
      score: p ? readinessScore(p) : 0,
    };
  });

  const overduePre = projects.filter((p) => {
    if (!p.shootDate) return false;
    const days = (new Date(p.shootDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days > 7) return false;
    const pre = p.checklists["Pre-Production"];
    const pct = pre.length ? pre.filter((i) => i.done).length / pre.length : 0;
    return pct < 0.8;
  });

  const onTime = projects
    .filter((p) => p.stage === "Delivered" && p.deliveryDate)
    .map((p) => ({ ok: new Date(p.deliveryDate!).getTime() >= new Date(p.createdAt).getTime() }));
  const onTimePct = onTime.length
    ? Math.round((onTime.filter((x) => x.ok).length / onTime.length) * 100)
    : 0;

  const driveOrganized = projects.filter((p) => p.driveLink).length;

  const checklistAvg = (() => {
    if (!projects.length) return 0;
    const total = projects.reduce((a, p) => a + checklistProgress(p).pct, 0);
    return Math.round(total / projects.length);
  })();

  const blockersResolved = projects
    .flatMap((p) => p.log)
    .filter((l) => l.type === "issue" && sameWeek(l.ts)).length;

  return {
    upcomingThisWeek: upcomingThisWeek.length,
    upcomingAll: upcoming.length,
    readiness,
    overduePre: overduePre.length,
    onTimePct,
    driveOrganized,
    driveTotal: projects.length,
    checklistAvg,
    blockersResolved,
  };
}
