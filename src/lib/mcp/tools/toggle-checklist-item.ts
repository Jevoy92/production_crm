import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult } from "../supabase";

export default defineTool({
  name: "toggle_checklist_item",
  title: "Toggle checklist item",
  description: "Set the done state of a checklist item by id.",
  inputSchema: {
    id: z.string().uuid(),
    done: z.boolean(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, done }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("checklist_items")
      .update({ done })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: `Item ${id} set to done=${done}` }],
      structuredContent: { item: data },
    };
  },
});