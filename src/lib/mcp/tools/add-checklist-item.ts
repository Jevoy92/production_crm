import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult } from "../supabase";

export default defineTool({
  name: "add_checklist_item",
  title: "Add checklist item",
  description: "Add a new item to a checklist tab (optionally in a specific section).",
  inputSchema: {
    tab: z.string().min(1),
    text: z.string().min(1),
    section: z.string().optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ tab, text, section }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const supabase = supabaseForUser(ctx);
    const { data: last } = await supabase
      .from("checklist_items")
      .select("sort_order")
      .eq("tab", tab)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (last?.sort_order ?? 0) + 10;
    const { data, error } = await supabase
      .from("checklist_items")
      .insert({ tab, text, section: section ?? null, sort_order: nextOrder, done: false })
      .select()
      .maybeSingle();
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: `Added item ${data?.id}` }],
      structuredContent: { item: data },
    };
  },
});