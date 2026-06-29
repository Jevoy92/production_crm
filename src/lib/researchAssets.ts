import { supabase } from "@/integrations/supabase/client";

export type ResearchAsset = {
  id: string;
  theme_no: string;
  card_id: string;
  kind: "image" | "video" | "link" | "file";
  storage_path: string | null;
  source_url: string | null;
  caption: string | null;
  og_title: string | null;
  og_image: string | null;
  mime_type: string | null;
  created_by: string | null;
  created_at: string;
  /** Resolved signed URL (filled in after fetch). */
  display_url?: string;
};

const BUCKET = "script-research";

function kindFromFile(file: File): "image" | "video" | "file" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
}

export async function listAssets(themeNo: string): Promise<ResearchAsset[]> {
  const { data, error } = await supabase
    .from("research_assets")
    .select("*")
    .eq("theme_no", themeNo)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as ResearchAsset[];

  // Batch-create signed URLs for storage-backed assets
  const paths = rows
    .filter((r) => r.storage_path)
    .map((r) => r.storage_path as string);
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 60 * 60);
    const map = new Map(
      (signed ?? []).map((s) => [s.path as string, s.signedUrl]),
    );
    for (const r of rows) {
      if (r.storage_path) r.display_url = map.get(r.storage_path);
    }
  }
  // For link assets without og_image, show source_url
  for (const r of rows) {
    if (!r.display_url) {
      r.display_url = r.og_image ?? r.source_url ?? undefined;
    }
  }
  return rows;
}

export async function uploadAssetFile(params: {
  themeNo: string;
  cardId: string;
  file: File;
  caption?: string;
}): Promise<ResearchAsset> {
  const { themeNo, cardId, file, caption } = params;
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${themeNo}/${cardId}/${Date.now()}-${safe}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("research_assets")
    .insert({
      theme_no: themeNo,
      card_id: cardId,
      kind: kindFromFile(file),
      storage_path: path,
      mime_type: file.type || null,
      caption: caption || null,
      created_by: userData.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ResearchAsset;
}

export async function addLinkAsset(params: {
  themeNo: string;
  cardId: string;
  url: string;
  caption?: string;
  og?: { title?: string; image?: string };
}): Promise<ResearchAsset> {
  const { themeNo, cardId, url, caption, og } = params;
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("research_assets")
    .insert({
      theme_no: themeNo,
      card_id: cardId,
      kind: "link",
      source_url: url,
      caption: caption || null,
      og_title: og?.title || null,
      og_image: og?.image || null,
      created_by: userData.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ResearchAsset;
}

export async function deleteAsset(asset: ResearchAsset): Promise<void> {
  if (asset.storage_path) {
    await supabase.storage.from(BUCKET).remove([asset.storage_path]);
  }
  const { error } = await supabase
    .from("research_assets")
    .delete()
    .eq("id", asset.id);
  if (error) throw error;
}

export async function updateAssetCaption(
  id: string,
  caption: string,
): Promise<void> {
  const { error } = await supabase
    .from("research_assets")
    .update({ caption })
    .eq("id", id);
  if (error) throw error;
}

// ---- Checklist ----

export type ChecklistRow = { item_key: string; checked: boolean };

export async function listChecklist(themeNo: string): Promise<ChecklistRow[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("research_checklist")
    .select("item_key, checked")
    .eq("theme_no", themeNo)
    .eq("user_id", userData.user.id);
  if (error) throw error;
  return (data ?? []) as ChecklistRow[];
}

export async function toggleChecklistItem(
  themeNo: string,
  itemKey: string,
  checked: boolean,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const { error } = await supabase.from("research_checklist").upsert(
    {
      theme_no: themeNo,
      item_key: itemKey,
      checked,
      user_id: userData.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,theme_no,item_key" },
  );
  if (error) throw error;
}