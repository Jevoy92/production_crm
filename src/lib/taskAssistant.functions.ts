import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const MODEL = "google/gemini-3-flash-preview";

const TaskInput = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

const Input = z.object({
  person: z.string().min(1).max(80),
  role: z.string().max(80).optional(),
  tasks: z.array(TaskInput).min(1).max(40),
});

const TaskSuggestion = z.object({
  taskId: z.string(),
  rank: z.number().int().min(1),
  reason: z.string().min(3).max(280),
  nextSteps: z.array(z.string().min(2).max(160)).min(1).max(4),
});

const OutputSchema = z.object({
  summary: z.string().min(10).max(600),
  suggestions: z.array(TaskSuggestion).min(1).max(20),
});

export type TaskAssistantResult = z.infer<typeof OutputSchema>;

export const generateTaskAssist = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<TaskAssistantResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const taskList = data.tasks
      .map(
        (t, i) =>
          `${i + 1}. [${t.id}] "${t.title}" — priority:${t.priority ?? "-"} due:${t.dueDate ?? "none"} status:${t.status ?? "todo"}${t.notes ? ` notes:${t.notes.slice(0, 200)}` : ""}`,
      )
      .join("\n");

    const system =
      "You are a sharp, terse chief-of-staff for a video production company. " +
      "Given an operator's open tasks, you (1) write a 1–2 sentence summary of what's stuck or needs attention, " +
      "(2) rank every task by what they should do first today, with a short reason, " +
      "(3) propose 1–3 concrete next-step subtasks PER TASK. " +
      "CRITICAL: next-steps MUST be specific to each task's title and notes — never generic boilerplate like 'break into next step' or 'set a due date'. " +
      "If the title says 'Email Alex about invoice', a next step is 'Draft email to Alex with invoice #, due date, payment link'. " +
      "Use verbs and concrete nouns from the task itself.";

    const prompt = `Operator: ${data.person}${data.role ? ` (${data.role})` : ""}\n\nOpen tasks:\n${taskList}\n\nReturn JSON only.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway(MODEL),
        system,
        prompt,
        experimental_output: Output.object({ schema: OutputSchema }),
      });
      return experimental_output;
    } catch (err) {
      console.error("[taskAssist] AI call failed, using fallback:", err);
      // Deterministic fallback so the UI never breaks
      return {
        summary: `${data.person} has ${data.tasks.length} open task${data.tasks.length === 1 ? "" : "s"}. AI assist is temporarily unavailable — focus on High priority items first.`,
        suggestions: data.tasks.slice(0, 6).map((t, i) => ({
          taskId: t.id,
          rank: i + 1,
          reason: t.priority === "High" ? "High priority" : "Open task",
          nextSteps: deriveFallbackSteps(t.title, t.notes),
        })),
      };
    }
  });

function deriveFallbackSteps(title: string, notes?: string): string[] {
  const t = title.trim();
  const lower = t.toLowerCase();
  const steps: string[] = [];
  const verb = lower.match(/^(email|call|text|dm|message|review|edit|cut|film|shoot|write|draft|send|post|schedule|publish|upload|design|build|fix|book|pay|invoice|order|buy|research|plan|outline|record)\b/)?.[1];
  const rest = verb ? t.slice(verb.length).trim().replace(/^[:\-—]\s*/, "") : t;
  if (verb) {
    steps.push(`${verb[0].toUpperCase()}${verb.slice(1)} — confirm exactly who/what: ${rest || "(fill in)"}`);
    steps.push(`Draft the ${verb} content and review before sending/shipping`);
  } else {
    steps.push(`Define the concrete outcome for "${t}"`);
    steps.push(`Identify the very next physical action toward "${t}"`);
  }
  if (notes && notes.trim()) steps.push(`Re-check notes: ${notes.trim().slice(0, 100)}`);
  return steps.slice(0, 3);
}