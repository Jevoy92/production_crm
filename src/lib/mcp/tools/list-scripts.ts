import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthorized, errorResult } from "../supabase";

export default defineTool({
  name: "list_scripts",
  title: "List scripts",
  description:
    "List scripts from the Palmer House Studio library. Returns titles, brand, and updated_at (does not include full body).",
  inputSchema: {
    brand: z
      .string()
      .optional()
      .describe("Optional brand filter (e.g. 'jevoy-palmer', 'palmer-house', 'mindyourbizniz')."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ brand, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthorized();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("studio_scripts")
      .select("id,title,brand,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (brand) query = query.eq("brand", brand);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { scripts: data ?? [] },
    };
  },
});