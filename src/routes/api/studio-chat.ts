import { createFileRoute } from "@tanstack/react-router";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { buildSystemPrompt } from "@/lib/masterPrompt.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BodySchema = z.object({
  scriptId: z.string().uuid(),
  brand: z.string().min(1).max(40),
  title: z.string().max(200).default(""),
  bodyMd: z.string().max(500_000).default(""),
  messages: z.array(z.any()),
});

export const Route = createFileRoute("/api/studio-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = await request.json();
        const parsed = BodySchema.safeParse(json);
        if (!parsed.success) {
          return new Response("Invalid request", { status: 400 });
        }
        const { scriptId, brand, title, bodyMd, messages } = parsed.data;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const uiMessages = messages as UIMessage[];
        const lastUser = [...uiMessages].reverse().find((m) => m.role === "user");
        const lastUserText =
          lastUser?.parts
            ?.map((p) => (p.type === "text" ? p.text : ""))
            .join("") ?? "";

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: buildSystemPrompt({ brand, title, bodyMd }),
          messages: await convertToModelMessages(uiMessages),
          onFinish: async ({ text }) => {
            try {
              if (lastUserText) {
                await supabaseAdmin.from("studio_messages").insert({
                  script_id: scriptId,
                  role: "user",
                  content: lastUserText,
                });
              }
              if (text) {
                await supabaseAdmin.from("studio_messages").insert({
                  script_id: scriptId,
                  role: "assistant",
                  content: text,
                });
              }
            } catch (e) {
              console.error("[studio-chat] persist failed", e);
            }
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: uiMessages });
      },
    },
  },
});