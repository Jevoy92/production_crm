import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const ActionSchema = z.object({
  type: z.enum([
    "create_task",
    "create_project",
    "update_shoot",
    "create_shoot",
    "set_project_stage",
  ]),
  title: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  ownerId: z.string().optional(),
  shootId: z.string().optional(),
  palType: z.enum(["Visibility", "Systems", "YouTube", "Commercial"]).optional(),
  stage: z
    .enum([
      "Lead",
      "Strategy Call",
      "Proposal Sent",
      "Booked",
      "Pre-Production",
      "Shoot Day",
      "In Post",
      "Delivered",
      "Archived",
    ])
    .optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  arrival: z.string().optional(),
  goals: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["Scheduled", "Complete", "Cancelled"]).optional(),
  dueDate: z.string().optional(),
  shootDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  priority: z.enum(["Low", "Med", "High"]).optional(),
});

const ResponseSchema = z.object({
  reply: z.string().describe("Natural conversational reply for the user. Use markdown. If you generated a script or SOP, include the full text here."),
  actions: z.array(ActionSchema).describe("Structured mutations to apply to the Production OS. Empty if the user is only asking a question or generating content."),
});

const SYSTEM = `You are Pals, Palmer House Productions' in-app AI assistant inside their Production OS.

You help Jevoy and team:
- Draft scripts (Visibility shorts, YouTube longform, Commercials, internal Systems videos) in Palmer House voice: direct, confident, no fluff, hook-driven.
- Write SOPs as clean numbered checklists.
- Create todos / tasks.
- Create or update projects and shoots, adjust the production schedule.
- Answer questions about the OS data passed to you.

Rules:
- When the user asks you to add a task, project, or schedule change, emit a structured action in "actions". Always also reply in natural language confirming what you did.
- Use ONLY ids from the supplied CONTEXT for assigneeId, projectId, clientId, ownerId, shootId. If you can't confidently match a name to an id, ask the user instead of guessing.
- For dates use ISO YYYY-MM-DD. Times HH:MM 24h.
- For pure script/SOP/content generation, leave "actions" empty and put the full content in "reply".
- Keep replies tight. No emojis unless asked.`;

export const Route = createFileRoute("/api/pals")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: {
          messages?: Array<{ role: "user" | "assistant"; content: string }>;
          context?: unknown;
        };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (!messages.length) return new Response("messages required", { status: 400 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        try {
          const { experimental_output } = await generateText({
            model,
            system: SYSTEM,
            messages: [
              {
                role: "system" as const,
                content:
                  "CONTEXT (current OS state, JSON):\n" +
                  JSON.stringify(body.context ?? {}, null, 2),
              },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            experimental_output: Output.object({ schema: ResponseSchema }),
          });

          return Response.json(experimental_output);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI request failed";
          const status = /429/.test(msg) ? 429 : /402/.test(msg) ? 402 : 500;
          return new Response(msg, { status });
        }
      },
    },
  },
});