import { MoreHorizontal, ExternalLink } from "lucide-react";

type Stage = "Pre-Prod" | "Shoot" | "Edit" | "Review" | "Delivery";
const stageStyles: Record<Stage, string> = {
  "Pre-Prod": "bg-chart-5/15 text-chart-5",
  Shoot: "bg-chart-1/15 text-chart-1",
  Edit: "bg-chart-2/15 text-chart-2",
  Review: "bg-chart-4/15 text-chart-4",
  Delivery: "bg-chart-3/15 text-chart-3",
};

const rows: {
  name: string;
  client: string;
  type: string;
  stage: Stage;
  owner: string;
  ownerColor: string;
  due: string;
  progress: number;
  priority: "High" | "Med" | "Low";
}[] = [
  {
    name: "Founder Story · Pt. 2",
    client: "Northwind Labs",
    type: "Brand Film",
    stage: "Edit",
    owner: "MR",
    ownerColor: "var(--color-chart-4)",
    due: "May 22",
    progress: 64,
    priority: "High",
  },
  {
    name: "Q2 Product Launch Reel",
    client: "Helix Robotics",
    type: "Launch",
    stage: "Shoot",
    owner: "JP",
    ownerColor: "var(--color-chart-1)",
    due: "May 24",
    progress: 38,
    priority: "High",
  },
  {
    name: "CEO Interview Series",
    client: "Atrium Partners",
    type: "Interview",
    stage: "Pre-Prod",
    owner: "SL",
    ownerColor: "var(--color-chart-2)",
    due: "Jun 02",
    progress: 18,
    priority: "Med",
  },
  {
    name: "Podcast — Ep. 14 → 17",
    client: "Internal",
    type: "Podcast",
    stage: "Edit",
    owner: "MR",
    ownerColor: "var(--color-chart-4)",
    due: "May 28",
    progress: 72,
    priority: "Med",
  },
  {
    name: "Recruiting Sizzle",
    client: "Lumen Health",
    type: "Social",
    stage: "Review",
    owner: "JP",
    ownerColor: "var(--color-chart-1)",
    due: "May 19",
    progress: 88,
    priority: "High",
  },
  {
    name: "Training Module 03–05",
    client: "Beacon Co.",
    type: "Training",
    stage: "Delivery",
    owner: "AP",
    ownerColor: "var(--color-chart-3)",
    due: "May 20",
    progress: 96,
    priority: "Low",
  },
  {
    name: "Conference Recap",
    client: "Vanta Group",
    type: "Event",
    stage: "Shoot",
    owner: "DH",
    ownerColor: "var(--color-chart-5)",
    due: "May 26",
    progress: 44,
    priority: "Med",
  },
];

export function ProjectsTable() {
  return (
    <div className="card-elevated rounded-2xl xl:col-span-2">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Active Productions
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight mt-0.5">Project Board</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[12px]">
          {["All", "Client", "Internal", "At risk"].map((t, i) => (
            <button
              key={t}
              className={`rounded-md px-2.5 py-1 ${i === 0 ? "bg-surface-3 text-foreground ring-inset-soft" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="text-left font-medium px-5 py-2">Project</th>
              <th className="text-left font-medium py-2">Stage</th>
              <th className="text-left font-medium py-2">Owner</th>
              <th className="text-left font-medium py-2 w-44">Progress</th>
              <th className="text-left font-medium py-2">Due</th>
              <th className="text-left font-medium py-2">Priority</th>
              <th className="px-5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className="border-t border-border hover:bg-surface-2/60 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    {r.name}
                    <ExternalLink className="size-3 text-muted-foreground/60" />
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {r.client} · {r.type}
                  </div>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${stageStyles[r.stage]}`}
                  >
                    {r.stage}
                  </span>
                </td>
                <td className="py-3">
                  <div
                    className="size-7 rounded-full grid place-items-center text-[10.5px] font-semibold text-primary-foreground ring-inset-soft"
                    style={{ background: r.ownerColor }}
                  >
                    {r.owner}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${r.progress}%`, background: "var(--gradient-amber)" }}
                      />
                    </div>
                    <span className="num text-[11px] text-muted-foreground w-7 text-right">
                      {r.progress}%
                    </span>
                  </div>
                </td>
                <td className="num py-3 text-foreground/85">{r.due}</td>
                <td className="py-3">
                  <span
                    className={`text-[11px] font-medium ${
                      r.priority === "High"
                        ? "text-destructive"
                        : r.priority === "Med"
                          ? "text-warning"
                          : "text-muted-foreground"
                    }`}
                  >
                    ● {r.priority}
                  </span>
                </td>
                <td className="px-5">
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
