import { useStore } from "@/lib/store";
import { useCCStore, type ContentItem, type CCShootDay } from "@/lib/ccStore";
import { generateShorts } from "@/lib/repurpose.functions";
import { supabase } from "@/integrations/supabase/client";
import type { PalsToolName } from "@/lib/pals.tools";

/**
 * Client-side tool executor for Pals.
 * Server defines tools with NO execute; we run them here against both
 * zustand stores (useStore syncs to workspace_state; useCC is browser-local).
 */

function lc(s: unknown): string {
  return typeof s === "string" ? s.toLowerCase() : "";
}

export async function executePalsTool(
  name: PalsToolName | string,
  input: any,
): Promise<unknown> {
  const store = useStore.getState() as any;
  const cc = useCCStore.getState() as any;

  switch (name) {
    // -------- READS --------
    case "searchWorkspace": {
      const q = lc(input?.query);
      const kinds = new Set<string>(
        Array.isArray(input?.kinds) && input.kinds.length ? input.kinds : [
          "task", "content", "core12", "shoot", "client", "project",
        ],
      );
      const out: any[] = [];
      if (kinds.has("task"))
        out.push(
          ...store.tasks
            .filter((t: any) => lc(t.title).includes(q) || lc((t as any).notes).includes(q))
            .slice(0, 10)
            .map((t: any) => ({ kind: "task", id: t.id, label: t.title, owner: (t as any).owner, status: t.status })),
        );
      if (kinds.has("content"))
        out.push(
          ...cc.library
            .filter((c: any) => lc(c.title).includes(q) || lc(c.businessPurpose).includes(q))
            .slice(0, 10)
            .map((c: any) => ({ kind: "content", id: c.id, label: c.title, type: c.type, status: c.status })),
        );
      if (kinds.has("core12"))
        out.push(
          ...cc.core12
            .filter((c: any) => lc(c.title).includes(q) || lc(c.hook).includes(q) || lc(c.businessPurpose).includes(q))
            .slice(0, 5)
            .map((c: any) => ({ kind: "core12", number: c.number, label: c.title, status: c.status })),
        );
      if (kinds.has("shoot"))
        out.push(
          ...cc.shoots
            .filter((s: any) => lc(s.theme).includes(q) || lc(s.location).includes(q) || lc(s.videos).includes(q))
            .slice(0, 10)
            .map((s: any) => ({ kind: "shoot", id: s.id, date: s.date, label: s.theme || s.location })),
        );
      if (kinds.has("client"))
        out.push(
          ...store.clients
            .filter((c: any) => lc(c.name).includes(q))
            .slice(0, 10)
            .map((c: any) => ({ kind: "client", id: c.id, label: c.name })),
        );
      if (kinds.has("project"))
        out.push(
          ...store.projects
            .filter((p: any) => lc(p.title).includes(q))
            .slice(0, 10)
            .map((p: any) => ({ kind: "project", id: p.id, label: p.title, stage: p.stage })),
        );
      return { results: out, total: out.length };
    }

    case "listTasks": {
      const owner = input?.owner as string | undefined;
      const status = input?.status as string | undefined;
      const dueBefore = input?.dueBefore as string | undefined;
      const limit = (input?.limit as number) ?? 20;
      let tasks = store.tasks.slice();
      if (owner) tasks = tasks.filter((t: any) => ((t as any).owner ?? "") === owner);
      if (status) tasks = tasks.filter((t: any) => t.status === status);
      if (dueBefore) tasks = tasks.filter((t: any) => (t as any).dueDate && (t as any).dueDate <= dueBefore);
      return {
        tasks: tasks.slice(0, limit).map((t: any) => ({
          id: t.id,
          title: t.title,
          owner: (t as any).owner,
          status: t.status,
          priority: (t as any).priority,
          dueDate: (t as any).dueDate,
        })),
        total: tasks.length,
      };
    }

    case "listContent": {
      let items = cc.library.slice();
      if (input?.type) items = items.filter((c: any) => c.type === input.type);
      if (input?.status) items = items.filter((c: any) => c.status === input.status);
      if (input?.platform) items = items.filter((c: any) => c.platform === input.platform);
      if (input?.relatedCore12) items = items.filter((c: any) => c.relatedCore12 === input.relatedCore12);
      const limit = (input?.limit as number) ?? 20;
      return {
        items: items.slice(0, limit).map((c: any) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          platform: c.platform,
          status: c.status,
          relatedCore12: c.relatedCore12,
        })),
        total: items.length,
      };
    }

    // -------- WRITES --------
    case "createTask": {
      const id = store.addTask({
        title: input.title,
        owner: input.owner,
        status: "todo",
        priority: input.priority ?? "Med",
        dueDate: input.dueDate,
        notes: input.notes ?? "",
        relatedContentId: input.relatedContentId,
        relatedShootId: input.relatedShootId,
      } as any);
      return { ok: true, id, message: `Created task "${input.title}" for ${input.owner}.` };
    }

    case "updateTask": {
      store.updateTask(input.id, input.patch);
      return { ok: true, id: input.id, message: "Task updated." };
    }

    case "completeTask": {
      store.updateTask(input.id, { status: "done" } as any);
      return { ok: true, id: input.id, message: "Task marked done." };
    }

    case "createContentItem": {
      const id = cc.addContentItem({
        title: input.title,
        type: input.type,
        platform: input.platform,
        palLane: input.palLane,
        status: input.status ?? "Idea",
        businessPurpose: input.businessPurpose ?? "",
        cta: input.cta ?? "",
        relatedCore12: input.relatedCore12,
        fileLocation: "",
        editorNotes: "",
        caption: "",
        thumbnailIdea: "",
        repurposingStatus: "",
        performanceNotes: "",
      } as Omit<ContentItem, "id">);
      return { ok: true, id, message: `Created content item "${input.title}".` };
    }

    case "updateContentItem": {
      cc.updateContentItem(input.id, input.patch);
      return { ok: true, id: input.id, message: "Content item updated." };
    }

    case "scheduleContent": {
      cc.updateContentItem(input.id, {
        publishDate: input.publishDate,
        publishStatus: "Scheduled",
        ...(input.platform ? { platform: input.platform } : {}),
      });
      cc.setPublishDate(input.id, input.publishDate);
      return { ok: true, id: input.id, message: `Scheduled for ${input.publishDate}.` };
    }

    case "createShoot": {
      const id = cc.addShoot({
        date: input.date,
        location: input.location ?? "",
        theme: input.theme ?? "",
        videos: input.videos ?? "",
      } as Partial<CCShootDay>);
      return { ok: true, id, message: `Created shoot day for ${input.date}.` };
    }

    case "updateShoot": {
      cc.updateShoot(input.id, input.patch);
      return { ok: true, id: input.id, message: "Shoot updated." };
    }

    case "updateCore12": {
      const ep = cc.core12.find((c: any) => c.number === input.number);
      if (!ep) return { ok: false, error: `Core 12 #${input.number} not found.` };
      cc.updateCore12(ep.id, input.patch);
      return { ok: true, number: input.number, message: `Core 12 #${input.number} updated.` };
    }

    case "generateSupportingShorts": {
      const ep = cc.core12.find((c: any) => c.number === input.scriptNum);
      if (!ep) return { ok: false, error: `Core 12 #${input.scriptNum} not found.` };
      // Build a script body from available fields.
      const scriptBody = [
        `Hook: ${ep.hook}`,
        `Audience: ${ep.audience}`,
        `Hypothesis: ${ep.hypothesis}`,
        `Business purpose: ${ep.businessPurpose}`,
        `CTA: ${ep.cta}`,
        "",
        "Supporting hooks already drafted:",
        ...ep.shortsHooks.map((h: any, i: any) => `  ${i + 1}. ${h}`),
      ].join("\n");
      const { shorts } = await generateShorts({
        data: {
          scriptNum: String(input.scriptNum),
          scriptTitle: ep.title,
          scriptBody,
        },
      });
      // Save each as a content item in the library.
      const ids = shorts.map((s: any, idx: any) => {
        const label = idx === 0 ? "Curiosity Hook" : idx === 1 ? "Problem/Aha" : "Practical Takeaway";
        return cc.addContentItem({
          title: `${ep.title} — ${label} Short`,
          type: "Short",
          platform: s.platform as ContentItem["platform"],
          palLane: ep.palLane,
          status: "Script Ready",
          businessPurpose: `Funnel viewers to Core 12 #${ep.number}: ${ep.title}`,
          cta: s.cta,
          relatedCore12: ep.number,
          parentScriptNum: ep.number,
          fileLocation: "",
          editorNotes: `HOOK: ${s.hook}\n\nBODY:\n${s.body}\n\nDuration target: ${s.durationSec}s`,
          caption: s.hook,
          thumbnailIdea: "",
          repurposingStatus: "Generated",
          performanceNotes: "",
        } as Omit<ContentItem, "id">);
      });
      return {
        ok: true,
        message: `Generated 3 supporting shorts for Core 12 #${ep.number}.`,
        ids,
        shorts: shorts.map((s: any, i: any) => ({
          label: i === 0 ? "Curiosity Hook" : i === 1 ? "Problem/Aha" : "Practical Takeaway",
          platform: s.platform,
          hook: s.hook,
          durationSec: s.durationSec,
        })),
      };
    }

    case "brainstormIdeas": {
      const ideas = Array.isArray(input?.ideas) ? input.ideas : [];
      if (!ideas.length) return { ok: false, error: "No ideas were provided." };
      const ids = ideas.map((idea: any) => {
        const isShort = idea.format === "short";
        return cc.addContentItem({
          title: idea.title,
          type: isShort ? "Short" : "Core 12",
          platform: isShort ? "YouTube Shorts" : "YouTube",
          palLane: "Evergreen",
          status: "Idea",
          businessPurpose: idea.angle || "",
          cta: "",
          relatedCore12: input.pillar,
          fileLocation: "",
          editorNotes: `HOOK: ${idea.hook}\n\nANGLE: ${idea.angle ?? ""}`,
          caption: idea.hook,
          thumbnailIdea: "",
          repurposingStatus: "",
          performanceNotes: `Brand: ${input.brand ?? "jevoy"}`,
        } as Omit<ContentItem, "id">);
      });
      return {
        ok: true,
        message: `Saved ${ids.length} idea${ids.length === 1 ? "" : "s"} to the Content library.`,
        ids,
      };
    }

    case "generateLongFormScript": {
      const { data, error } = await supabase
        .from("studio_scripts")
        .insert({
          title: input.title,
          brand: input.brand ?? "jevoy",
          body_md: input.body_md,
          body_html: "",
        })
        .select("id,title")
        .single();
      if (error) return { ok: false, error: error.message };
      // Also drop a placeholder content item so it shows in the library.
      const contentId = cc.addContentItem({
        title: input.title,
        type: "Core 12",
        platform: "YouTube",
        palLane: "Evergreen",
        status: "Script Ready",
        businessPurpose: "",
        cta: "",
        relatedCore12: input.pillar,
        fileLocation: `script:${data.id}`,
        editorNotes: "",
        caption: "",
        thumbnailIdea: "",
        repurposingStatus: "",
        performanceNotes: `Brand: ${input.brand ?? "jevoy"} • script_id: ${data.id}`,
      } as Omit<ContentItem, "id">);
      return {
        ok: true,
        message: `Long-form script "${input.title}" saved to Scripts library.`,
        scriptId: data.id,
        contentId,
      };
    }

    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

/** Build the workspace snapshot sent to the server with each request. */
export async function buildPalsSnapshot() {
  const store = useStore.getState() as any;
  const cc = useCCStore.getState() as any;
  const today = new Date().toISOString().slice(0, 10);

  // Fetch every script (RLS allows open read). Cap each body to keep tokens in check.
  let scripts: Array<{ id: string; title: string; brand: string; updated_at: string; body_md: string }> = [];
  try {
    const { data } = await supabase
      .from("studio_scripts")
      .select("id,title,brand,updated_at,body_md")
      .order("updated_at", { ascending: false });
    if (data) {
      scripts = data.map((s: any) => {
        const body = (s.body_md ?? "") as string;
        const truncated = body.length > 8000 ? body.slice(0, 8000) + "\n…[truncated]" : body;
        return {
          id: s.id,
          title: s.title,
          brand: s.brand,
          updated_at: s.updated_at,
          body_md: truncated,
        };
      });
    }
  } catch (e) {
    console.warn("[pals] failed to fetch scripts for snapshot", e);
  }

  return {
    today,
    counts: {
      tasks: store.tasks.length,
      openTasks: store.tasks.filter((t: any) => t.status !== "done").length,
      shoots: cc.shoots.length,
      contentItems: cc.library.length,
      clients: store.clients.length,
      projects: store.projects.length,
      scripts: scripts.length,
    },
    tasks: store.tasks.slice(0, 60).map((t: any) => ({
      id: t.id,
      title: t.title,
      owner: (t as any).owner,
      status: t.status,
      priority: (t as any).priority,
      dueDate: (t as any).dueDate,
    })),
    shoots: cc.shoots
      .slice()
      .sort((a: any, b: any) => (a.date ?? "").localeCompare(b.date ?? ""))
      .filter((s: any) => !s.date || s.date >= today)
      .slice(0, 20)
      .map((s: any) => ({
        id: s.id,
        date: s.date,
        location: s.location,
        theme: s.theme,
        status: s.status,
      })),
    core12: cc.core12.map((c: any) => ({
      number: c.number,
      title: c.title,
      status: c.status,
      scriptDone: c.scriptDone,
      filmedDone: c.filmedDone,
      publishedDone: c.publishedDone,
    })),
    content: cc.library.slice(0, 50).map((c: any) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      platform: c.platform,
      status: c.status,
      relatedCore12: c.relatedCore12,
    })),
    scripts,
  };
}