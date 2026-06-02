import { supabase } from "@/integrations/supabase/client";
import type { UIMessage } from "ai";

/**
 * Persistence for the Pals rolling conversation.
 * Single shared workspace conversation — no thread id, no user scoping.
 */

type Row = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: unknown;
  message_id: string | null;
  created_at: string;
};

export async function loadPalsMessages(): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("pals_messages")
    .select("id, role, parts, message_id, created_at")
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) {
    console.error("[pals] load failed", error);
    return [];
  }
  return (data as Row[]).map<UIMessage>((row) => ({
    id: row.message_id ?? row.id,
    role: row.role,
    parts: (Array.isArray(row.parts) ? row.parts : []) as UIMessage["parts"],
  }));
}

export async function savePalsMessage(msg: UIMessage): Promise<void> {
  const { error } = await supabase.from("pals_messages").insert({
    role: msg.role,
    parts: msg.parts as unknown as never,
    message_id: msg.id,
  });
  if (error) console.error("[pals] save failed", error);
}

export async function clearPalsMessages(): Promise<void> {
  const { error } = await supabase
    .from("pals_messages")
    .delete()
    .gte("created_at", "1970-01-01");
  if (error) console.error("[pals] clear failed", error);
}