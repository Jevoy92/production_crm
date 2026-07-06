import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult } from "../supabase";

export default defineTool({
  name: "list_checklist_items",
  title: "List checklist items",
  description:
    "List items on a checklist tab (e.g. 'internal', 'preprod', 'production', 'post'). Returns items grouped by section with done status.",
  inputSchema: {
    tab: z.string().min(1).describe("Checklist tab key, e.g. 'internal'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tab }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("checklist_items")
      .select("id,tab,section,text,done,sort_order")
      .eq("tab", tab)
      .order("sort_order", { ascending: true });
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { items: data ?? [] },
    };
  },
});