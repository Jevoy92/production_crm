import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult } from "../supabase";

export default defineTool({
  name: "get_script",
  title: "Get script",
  description: "Fetch a single script's full markdown body by id.",
  inputSchema: {
    id: z.string().uuid().describe("Script id (from list_scripts)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("studio_scripts")
      .select("id,title,brand,body_md,updated_at")
      .eq("id", id)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("Script not found.");
    return {
      content: [{ type: "text", text: `# ${data.title}\n\n${data.body_md ?? ""}` }],
      structuredContent: { script: data },
    };
  },
});