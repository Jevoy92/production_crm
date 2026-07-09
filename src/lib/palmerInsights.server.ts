import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { generateText } from "ai";

const TZ = "America/New_York";

function ymdInTZ(d: Date, tz = TZ) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
}
type LimitlessMessage = {
  id: string;
  text?: string;
  createdAt?: string;
  user?: { role?: string; name?: string };
};
type LimitlessChat = {
  id: string;
  summary?: string;
  createdAt?: string;
  messages?: LimitlessMessage[];
};

async function fetchTodaysDailyInsightsChat(): Promise<
  { chat: LimitlessChat; assistantText: string } | { error: string }
> {
  const key = process.env.LIMITLESS_API_KEY;
  if (!key) return { error: "no LIMITLESS_API_KEY" };
  const res = await fetch("https://api.limitless.ai/v1/chats?limit=30", {
    headers: { "X-API-Key": key, Accept: "application/json" },
  });
  if (!res.ok) return { error: `Limitless ${res.status}` };
  const json = (await res.json()) as { data?: { chats?: LimitlessChat[] } };
  const chats = json.data?.chats ?? [];
  const daily = chats.filter((c) => (c.summary ?? "").toLowerCase().includes("daily insight"));
  if (!daily.length) return { error: "no Daily insights chat found" };
  const today = ymdInTZ(new Date());
  const todays = daily.find((c) => c.createdAt && ymdInTZ(new Date(c.createdAt)) === today);
  const chat = todays ?? daily[0];
  const assistant = (chat.messages ?? [])
    .filter((m) => m.user?.role !== "user" && (m.text ?? "").trim().length > 0)
    .pop();
  if (!assistant?.text) return { error: "Daily insights chat has no assistant reply" };
  return { chat, assistantText: assistant.text };
}

export async function generatePalmerInsightsForToday(): Promise<string> {
  const LOVABLE_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_KEY) throw new Error("missing LOVABLE_API_KEY");

  const src = await fetchTodaysDailyInsightsChat();
  if ("error" in src) {
    return `_Could not load Limitless Daily Insights — ${src.error}._`;
  }
  const chatDate = src.chat.createdAt ? ymdInTZ(new Date(src.chat.createdAt)) : "recent";
  const source = src.assistantText.slice(0, 18000);

  const gateway = createLovableAiGatewayProvider(LOVABLE_KEY);
  const sys = [
    "You are Pals, extracting Palmer House Productions items from Jevoy's Limitless Daily Insights digest.",
    "The input is an already-summarised daily digest (highlights, action items, personal CRM, wisdom, etc.). Pull only the parts that touch the business.",
    "Scope (be generous): explicit Palmer House / PH / client / prospect mentions, plus production, sales, ops, hiring, finance, pricing, brand positioning, networking, and business decisions that touch the videography/production business.",
    "Output format (markdown only, no preamble):",
    "- 4–10 tight bullets. Lead with the concrete thing (name, number, decision), then a short 'Next step:' clause where obvious.",
    "- Group under short bold sub-labels if it helps (e.g. **Pipeline**, **Ops**, **Finance**, **Positioning**). Otherwise a flat bullet list.",
    "- Preserve names, dollar amounts, and dates verbatim from the source.",
    "- No filler, no 'Good morning', no restating the prompt. If truly nothing qualifies, emit exactly: `_No Palmer House activity captured yesterday._`",
  ].join("\n");

  const res = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    system: sys,
    prompt: `Limitless Daily Insights (${chatDate}):\n\n${source}`,
  });
  return res.text.trim() || "_No Palmer House activity captured yesterday._";
}