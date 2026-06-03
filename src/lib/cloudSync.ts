import { useEffect, useState } from "react";
import { useStore } from "./store";
import { useCCStore } from "./ccStore";
import { supabase } from "@/integrations/supabase/client";

// Fields synced across the team. Anything not in this list stays per-device.
const SYNCED_KEYS = [
  "team",
  "clients",
  "projects",
  "shoots",
  "playbook",
  "gearItems",
  "gearKits",
  "assets",
  "tasks",
  "templates",
  "contentPieces",
  "trackedKpis",
  "finance",
] as const;

// Content Command Center store (Content Library, Core 12, CC shoots, sprint
// tasks, photo assets). Synced under a `cc` namespace in the same shared row.
const CC_SYNCED_KEYS = ["core12", "library", "shoots", "tasks", "weeks", "photoAssets"] as const;

type SyncedKey = (typeof SYNCED_KEYS)[number];

// `cc` only joins the pushed snapshot once we hold authoritative content —
// i.e. after we've loaded it from the cloud OR the user edited it locally.
// This prevents a fresh/seed session from clobbering the team's real content.
let ccDirty = false;

function ccSnapshot() {
  const state: any = useCCStore.getState();
  const out: Record<string, unknown> = {};
  for (const k of CC_SYNCED_KEYS) out[k] = state[k];
  return out;
}

function snapshot(state: any) {
  const out: Record<string, unknown> = {};
  for (const k of SYNCED_KEYS) out[k] = state[k];
  if (ccDirty) out.cc = ccSnapshot();
  return out;
}

// Lamport-ish counter so we can ignore echoes of our own writes.
let lastAppliedVersion = -1;
let suppressPush = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPush = false;
let inflight = false;
let clientId = Math.random().toString(36).slice(2);

type Status = "idle" | "loading" | "syncing" | "error";

let statusListeners = new Set<(s: Status) => void>();
let currentStatus: Status = "idle";
function setStatus(s: Status) {
  currentStatus = s;
  statusListeners.forEach((l) => l(s));
}

export function useSyncStatus(): Status {
  const [s, setS] = useState<Status>(currentStatus);
  useEffect(() => {
    statusListeners.add(setS);
    return () => {
      statusListeners.delete(setS);
    };
  }, []);
  return s;
}

async function pushNow() {
  if (inflight) {
    pendingPush = true;
    return;
  }
  inflight = true;
  setStatus("syncing");
  try {
    const data = snapshot(useStore.getState());
    const { data: row, error } = await supabase
      .from("workspace_state")
      .update({
        data: data as any,
        // bump version + stash our clientId so we can detect echoes
        version: lastAppliedVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "shared")
      .select()
      .maybeSingle();
    if (error) throw error;
    if (row) lastAppliedVersion = (row as any).version ?? lastAppliedVersion + 1;
    setStatus("idle");
  } catch (e) {
    console.error("[cloudSync] push failed", e);
    setStatus("error");
  } finally {
    inflight = false;
    if (pendingPush) {
      pendingPush = false;
      schedulePush();
    }
  }
}

function schedulePush() {
  if (suppressPush) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 600);
}

function applyRemote(data: any, version: number) {
  if (!data || typeof data !== "object") return;
  if (version <= lastAppliedVersion) return;
  lastAppliedVersion = version;
  suppressPush = true;
  try {
    const patch: Record<string, unknown> = {};
    for (const k of SYNCED_KEYS) {
      if (k in data) patch[k] = (data as any)[k];
    }
    useStore.setState(patch as any);

    // Hydrate the content store if the cloud carries a `cc` namespace.
    const cc = (data as any).cc;
    if (cc && typeof cc === "object") {
      const ccPatch: Record<string, unknown> = {};
      for (const k of CC_SYNCED_KEYS) {
        if (k in cc) ccPatch[k] = cc[k];
      }
      if (Object.keys(ccPatch).length > 0) {
        useCCStore.setState(ccPatch as any);
        ccDirty = true; // we now hold authoritative content — safe to push it back
      }
    }
  } finally {
    // release on next tick so the resulting subscribe fire doesn't re-push
    setTimeout(() => {
      suppressPush = false;
    }, 0);
  }
}

let started = false;

/** Call once after auth. Hydrates from cloud, then keeps store ↔ cloud in sync. */
export async function startCloudSync() {
  if (started) return;
  started = true;
  setStatus("loading");

  // 1. Pull latest snapshot
  try {
    const { data: row, error } = await supabase
      .from("workspace_state")
      .select("data, version")
      .eq("id", "shared")
      .maybeSingle();
    if (error) throw error;
    if (row) {
      const version = (row as any).version ?? 0;
      const payload = (row as any).data ?? {};
      // If the cloud has data, it wins on load. If it's empty, push our local
      // state up so we don't lose what's already in this browser.
      const cloudHasData = Object.keys(payload).length > 0;
      if (cloudHasData) {
        applyRemote(payload, version);
      } else {
        lastAppliedVersion = version;
        schedulePush();
      }
    }
  } catch (e) {
    console.error("[cloudSync] initial load failed", e);
    setStatus("error");
  }

  // 2. Subscribe to remote changes
  supabase
    .channel("workspace_state_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "workspace_state", filter: "id=eq.shared" },
      (payload) => {
        const row: any = payload.new;
        if (!row) return;
        applyRemote(row.data, row.version ?? 0);
      },
    )
    .subscribe();

  // 3. Push local changes (debounced)
  useStore.subscribe((state, prev) => {
    if (suppressPush) return;
    // only push if a synced key actually changed
    for (const k of SYNCED_KEYS) {
      if ((state as any)[k] !== (prev as any)[k]) {
        schedulePush();
        return;
      }
    }
  });

  // 3b. Push content-store changes too. A real local edit makes `cc`
  // authoritative, so it joins the snapshot from here on.
  useCCStore.subscribe((state, prev) => {
    if (suppressPush) return;
    for (const k of CC_SYNCED_KEYS) {
      if ((state as any)[k] !== (prev as any)[k]) {
        ccDirty = true;
        schedulePush();
        return;
      }
    }
  });

  setStatus("idle");
}

export { SYNCED_KEYS };
export type { SyncedKey };