import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BRANDS = ["original", "jevoy", "palmer-house", "mindyourbizniz"] as const;

export const listScripts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("studio_scripts")
    .select("id,title,brand,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getScript = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: script, error } = await supabaseAdmin
      .from("studio_scripts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return script;
  });

export const createScript = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200).optional(),
        brand: z.enum(BRANDS).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("studio_scripts")
      .insert({
        title: data.title ?? "Untitled script",
        brand: data.brand ?? "jevoy",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateScript = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        brand: z.enum(BRANDS).optional(),
        body_html: z.string().max(500_000).optional(),
        body_md: z.string().max(500_000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("studio_scripts")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteScript = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("studio_scripts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMessages = createServerFn({ method: "GET" })
  .inputValidator((d: { scriptId: string }) =>
    z.object({ scriptId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("studio_messages")
      .select("id,role,content,created_at")
      .eq("script_id", data.scriptId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const clearMessages = createServerFn({ method: "POST" })
  .inputValidator((d: { scriptId: string }) =>
    z.object({ scriptId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("studio_messages")
      .delete()
      .eq("script_id", data.scriptId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });