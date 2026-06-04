import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import {
  searchWorkspaceInput,
  listTasksInput,
  listContentInput,
  createTaskInput,
  updateTaskInput,
  completeTaskInput,
  createContentItemInput,
  updateContentItemInput,
  scheduleContentInput,
  createShootInput,
  updateShootInput,
  updateCore12Input,
  generateSupportingShortsInput,
  brainstormIdeasInput,
  generateLongFormScriptInput,
} from "@/lib/pals.tools";

// ---------- Limitless (server-executed tool) ----------
const fetchLimitlessLifelogsInput = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("ISO date YYYY-MM-DD. Defaults to today (America/New_York)."),
  timezone: z.string().default("America/New_York"),
  limit: z.number().int().min(1).max(20).default(10),
});

async function fetchLimitlessLifelogs(args: {
  date?: string;
  timezone: string;
  limit: number;
}) {
  const key = process.env.LIMITLESS_API_KEY;
  if (!key) {
    return { error: "LIMITLESS_API_KEY not configured", lifelogs: [] };
  }
  const date =
    args.date ??
    new Intl.DateTimeFormat("en-CA", { timeZone: args.timezone }).format(new Date());
  const url = new URL("https://api.limitless.ai/v1/lifelogs");
  url.searchParams.set("date", date);
  url.searchParams.set("timezone", args.timezone);
  url.searchParams.set("limit", String(args.limit));
  url.searchParams.set("includeMarkdown", "true");
  url.searchParams.set("direction", "asc");

  try {
    const res = await fetch(url.toString(), {
      headers: { "X-API-Key": key, Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Limitless API ${res.status}: ${text.slice(0, 300)}`, lifelogs: [] };
    }
    const json = (await res.json()) as {
      data?: { lifelogs?: Array<{ id?: string; title?: string; startTime?: string; endTime?: string; markdown?: string }> };
    };
    const lifelogs = (json.data?.lifelogs ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      startTime: l.startTime,
      endTime: l.endTime,
      markdown: l.markdown?.slice(0, 4000) ?? "",
    }));
    return { date, timezone: args.timezone, count: lifelogs.length, lifelogs };
  } catch (err) {
    return { error: `Limitless fetch failed: ${String(err)}`, lifelogs: [] };
  }
}

/** Minimal snapshot the client sends. Keep small — model context budget. */
const SnapshotSchema = z.object({
  today: z.string(),
  counts: z.record(z.string(), z.number()).optional(),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        owner: z.string().optional(),
        status: z.string(),
        priority: z.string().optional(),
        dueDate: z.string().optional(),
      }),
    )
    .max(60)
    .optional(),
  shoots: z
    .array(
      z.object({
        id: z.string(),
        date: z.string().optional(),
        location: z.string().optional(),
        theme: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .max(30)
    .optional(),
  core12: z
    .array(
      z.object({
        number: z.number(),
        title: z.string(),
        status: z.string(),
        scriptDone: z.boolean().optional(),
        filmedDone: z.boolean().optional(),
        publishedDone: z.boolean().optional(),
      }),
    )
    .max(12)
    .optional(),
  content: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        type: z.string(),
        platform: z.string().optional(),
        status: z.string(),
        relatedCore12: z.number().optional(),
      }),
    )
    .max(60)
    .optional(),
  scripts: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        brand: z.string().optional(),
        updated_at: z.string().optional(),
        body_md: z.string().optional(),
      }),
    )
    .max(100)
    .optional(),
}).partial();

const BodySchema = z.object({
  messages: z.array(z.any()),
  snapshot: SnapshotSchema.optional(),
});

function buildSystemPrompt(snapshot: z.infer<typeof SnapshotSchema> | undefined) {
  const lines: string[] = [
    "You are Pals — the AI production operating-system assistant for Palmer House Productions.",
    "You support two operators: Jevoy (creator, founder; films, writes, approves) and Shannen (producer/PA; preps, organizes, hands off, publishes).",
    "",
    "Your job: help them RUN daily production. Be concise, action-oriented, and always prefer doing over explaining.",
    "When the user asks for an action that mutates data, call the matching tool — do NOT tell them to click around the app.",
    "When you ask a clarifying question, ask the smallest one needed to act.",
    "",
    "Workspace structure:",
    "  • Core 12 — the flagship YouTube long-form series (episodes 1–12).",
    "  • Content library — every content asset (long-form, shorts, website videos, photo-to-video, system videos, etc.).",
    "  • Productions / Shoots — filming days with checklists.",
    "  • Tasks — work items owned by Jevoy or Shannen.",
    "  • Repurposing — turn ONE long-form Core 12 script into 3 supporting shorts (Curiosity Hook, Problem/Aha, Practical Takeaway).",
    "  • Scripts library — every long-form script (studio_scripts). You can READ the full body of every script in the snapshot below.",
    "",
    "Owner conventions:",
    "  • Jevoy: scripting, filming, creative direction, approvals, decisions.",
    "  • Shannen: shoot prep, BTS, file organization, editor handoff, captions, publishing, weekly recap.",
    "",
    "Content creation capabilities:",
    "  • brainstormIdeas — propose N video ideas (title + hook + angle + format). Draft the ideas YOURSELF in the tool input. They save to the Content library as ideas on approval.",
    "  • generateLongFormScript — draft a FULL long-form script (markdown: hook, body, CTA) and save it to the Scripts library. Match the voice and structure of the existing scripts shown below. Write the entire script in body_md before calling — do not call with a placeholder.",
    "  • generateSupportingShorts — once a long-form exists as a Core 12 episode, generate the 3 supporting shorts and auto-save to Library.",
    "  • fetchLimitlessLifelogs — pull Jevoy's Limitless pendant transcriptions (daily briefs / conversations). Use this proactively when the user asks for a morning digest, daily recap, summary of yesterday, or anything that depends on what Jevoy actually said/heard. Runs silently — no approval needed. Default to today; pass `date` for a specific day.",
    "",
    "Mutating tools (create/update/schedule/complete/generate) will ask the user to APPROVE before they run. Don't apologize for asking — call the tool and let the UI handle confirmation.",
    "Read tools (search/list) run silently.",
    "",
    "Format answers in clean markdown. Keep replies tight. Skip filler.",
  ];

  if (snapshot) {
    lines.push("", "--- WORKSPACE SNAPSHOT (live) ---");
    if (snapshot.today) lines.push(`Today: ${snapshot.today}`);
    if (snapshot.counts) {
      lines.push(
        "Counts: " +
          Object.entries(snapshot.counts)
            .map(([k, v]) => `${k}=${v}`)
            .join(", "),
      );
    }
    if (snapshot.core12?.length) {
      lines.push("", "Core 12:");
      for (const c of snapshot.core12) {
        const flags = [
          c.scriptDone && "script",
          c.filmedDone && "filmed",
          c.publishedDone && "published",
        ]
          .filter(Boolean)
          .join("/");
        lines.push(`  #${c.number} ${c.title} — ${c.status}${flags ? ` [${flags}]` : ""}`);
      }
    }
    if (snapshot.shoots?.length) {
      lines.push("", "Upcoming shoots:");
      for (const s of snapshot.shoots.slice(0, 10)) {
        lines.push(`  ${s.date ?? "?"} — ${s.theme ?? "(no theme)"} @ ${s.location ?? "?"} [${s.status ?? "?"}] (id: ${s.id})`);
      }
    }
    if (snapshot.tasks?.length) {
      const open = snapshot.tasks.filter((t) => t.status !== "done");
      lines.push("", `Open tasks (${open.length}):`);
      for (const t of open.slice(0, 25)) {
        lines.push(
          `  [${t.owner ?? "?"}] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ""} [${t.status}${t.priority ? `/${t.priority}` : ""}] (id: ${t.id})`,
        );
      }
    }
    if (snapshot.content?.length) {
      lines.push("", "Recent content items:");
      for (const c of snapshot.content.slice(0, 25)) {
        lines.push(
          `  ${c.title} — ${c.type} on ${c.platform ?? "?"} [${c.status}]${c.relatedCore12 ? ` (→ Core12 #${c.relatedCore12})` : ""} (id: ${c.id})`,
        );
      }
    }
    if (snapshot.scripts?.length) {
      lines.push("", `Scripts library (${snapshot.scripts.length}) — full bodies follow:`);
      for (const s of snapshot.scripts) {
        lines.push("", `### ${s.title} [brand: ${s.brand ?? "?"}] (id: ${s.id})`);
        if (s.body_md && s.body_md.trim()) {
          lines.push(s.body_md);
        } else {
          lines.push("(empty)");
        }
      }
    }
    lines.push("--- END SNAPSHOT ---");
  }

  return lines.join("\n");
}

/** Tools have NO `execute` — the browser runs them via addToolResult. */
function buildTools() {
  const passthrough = <S extends z.ZodTypeAny>(inputSchema: S, description: string) =>
    tool({ description, inputSchema });

  return {
    searchWorkspace: passthrough(
      searchWorkspaceInput,
      "Search across tasks, content, Core 12, shoots, clients, projects. Returns a list of matches.",
    ),
    listTasks: passthrough(
      listTasksInput,
      "List tasks with optional filters (owner, status, dueBefore).",
    ),
    listContent: passthrough(
      listContentInput,
      "List content items with optional filters (type, status, platform, relatedCore12).",
    ),

    createTask: passthrough(
      createTaskInput,
      "Create a new task. Requires user approval before it runs.",
    ),
    updateTask: passthrough(
      updateTaskInput,
      "Update an existing task by id (status, owner, due date, priority, etc.).",
    ),
    completeTask: passthrough(completeTaskInput, "Mark a task as done by id."),

    createContentItem: passthrough(
      createContentItemInput,
      "Add a content item to the library (title, type, platform, palLane, business purpose, CTA, related Core 12 episode).",
    ),
    updateContentItem: passthrough(
      updateContentItemInput,
      "Update fields on a content item by id (status, caption, thumbnail idea, file location, publish date, etc.).",
    ),
    scheduleContent: passthrough(
      scheduleContentInput,
      "Schedule a content item for a publish date on a platform.",
    ),

    createShoot: passthrough(
      createShootInput,
      "Create a new shoot day (date, location, theme, videos being filmed).",
    ),
    updateShoot: passthrough(
      updateShootInput,
      "Update fields on a shoot day by id.",
    ),

    updateCore12: passthrough(
      updateCore12Input,
      "Update a Core 12 episode by number — set status, mark script/filmed/edited/published, add notes for Shannen/Jevoy/Editor.",
    ),

    generateSupportingShorts: passthrough(
      generateSupportingShortsInput,
      "Run the Repurposing Engine for a Core 12 episode. Generates the 3 supporting short-form scripts (Curiosity Hook, Problem/Aha, Practical Takeaway) and saves them to the library.",
    ),

    brainstormIdeas: passthrough(
      brainstormIdeasInput,
      "Propose N video ideas. YOU draft the ideas yourself (title, hook, angle, format) in the tool input. On user approval, each idea is saved to the Content library as an idea.",
    ),

    generateLongFormScript: passthrough(
      generateLongFormScriptInput,
      "Draft a full long-form script and save it to the Scripts library. YOU write the entire script body in markdown (body_md) in the tool input — hook, body sections, and CTA. Match the voice/structure of existing scripts shown in the snapshot. Approval-gated.",
    ),

    fetchLimitlessLifelogs: tool({
      description:
        "Fetch Jevoy's Limitless pendant transcriptions for a given day (defaults to today). Returns the list of lifelogs with titles, times, and markdown transcripts. Use this for morning digests, daily recaps, or whenever you need to know what Jevoy actually discussed.",
      inputSchema: fetchLimitlessLifelogsInput,
      execute: async (args) => fetchLimitlessLifelogs(args),
    }),
  };
}

export const Route = createFileRoute("/api/pals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
          return new Response("Invalid request body", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const messages = parsed.data.messages as UIMessage[];

        const modelMessages = await convertToModelMessages(messages, {
          ignoreIncompleteToolCalls: true,
        });
        const result = streamText({
          model: gateway("google/gemini-3-pro-preview"),
          system: buildSystemPrompt(parsed.data.snapshot),
          messages: modelMessages,
          tools: buildTools(),
          stopWhen: stepCountIs(50),
          onError: ({ error }) => {
            console.error("[pals] streamText error", error);
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
        });
      },
    },
  },
});