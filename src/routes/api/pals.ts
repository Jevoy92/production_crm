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
} from "@/lib/pals.tools";

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
    "",
    "Owner conventions:",
    "  • Jevoy: scripting, filming, creative direction, approvals, decisions.",
    "  • Shannen: shoot prep, BTS, file organization, editor handoff, captions, publishing, weekly recap.",
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

        const result = streamText({
          model: gateway("google/gemini-3-pro-preview"),
          system: buildSystemPrompt(parsed.data.snapshot),
          messages: convertToModelMessages(messages),
          tools: buildTools(),
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
        });
      },
    },
  },
});