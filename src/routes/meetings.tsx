import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { Collapsible } from "@/components/app/AppShell";
import { Markdown } from "@/components/Markdown";
import { supabase } from "@/integrations/supabase/client";
import { NotebookPen, Plus, Trash2, Save, X, Calendar, Users, Eye, Pencil } from "lucide-react";

export const Route = createFileRoute("/meetings")({
  component: MeetingsPage,
  head: () => ({ meta: [{ title: "Meetings · Production OS" }] }),
});

type Meeting = {
  id: string;
  title: string;
  meeting_date: string;
  attendees: string;
  summary: string;
  transcript: string;
  decisions: string;
  next_steps: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
};

const todayET = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState<Partial<Meeting>>({});
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => meetings.find((m) => m.id === selectedId) ?? null,
    [meetings, selectedId],
  );

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) console.error("[meetings] load", error);
    setMeetings((data as Meeting[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("meetings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    if (selected) setDraft(selected);
  }, [selected]);

  async function createNew() {
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        title: "Untitled meeting",
        meeting_date: todayET(),
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    await load();
    setSelectedId((data as Meeting).id);
    setMode("edit");
  }

  async function saveDraft() {
    if (!selectedId) return;
    setSaving(true);
    const patch = {
      title: draft.title ?? "",
      meeting_date: draft.meeting_date ?? todayET(),
      attendees: draft.attendees ?? "",
      summary: draft.summary ?? "",
      transcript: draft.transcript ?? "",
      decisions: draft.decisions ?? "",
      next_steps: draft.next_steps ?? "",
      tags: draft.tags ?? [],
      source: draft.source ?? "",
    };
    const { error } = await supabase.from("meetings").update(patch).eq("id", selectedId);
    setSaving(false);
    if (error) {
      console.error(error);
      return;
    }
    setMode("view");
    await load();
  }

  async function deleteMeeting(id: string) {
    if (!confirm("Delete this meeting note? This cannot be undone.")) return;
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    if (selectedId === id) setSelectedId(null);
    await load();
  }

  return (
    <Shell
      title="Meetings"
      subtitle={
        loading
          ? "Shared notes & transcripts"
          : `${meetings.length} note${meetings.length === 1 ? "" : "s"} · shared transcripts`
      }
    >
      <div className="flex h-[calc(100vh-64px)] gap-4 p-4">
        {/* List */}
        <aside className="w-80 flex-shrink-0 bg-panel border border-line rounded-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NotebookPen size={16} className="text-mid" />
              <h2 className="text-hi font-semibold text-sm">Meetings</h2>
              <span className="text-lo text-xs">({meetings.length})</span>
            </div>
            <button
              onClick={createNew}
              className="flex items-center gap-1 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1.5 rounded-lg"
            >
              <Plus size={12} /> New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && <div className="text-lo text-sm p-4">Loading…</div>}
            {!loading && meetings.length === 0 && (
              <div className="text-lo text-sm p-4">
                No meetings yet. Click <strong>New</strong> to capture one.
              </div>
            )}
            {meetings.map((m) => {
              const active = m.id === selectedId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedId(m.id);
                    setMode("view");
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                    active ? "bg-brand-600 text-white" : "hover:bg-hover text-hi"
                  }`}
                >
                  <div className="font-semibold text-sm truncate">{m.title || "Untitled meeting"}</div>
                  <div className={`text-xs mt-0.5 flex items-center gap-2 ${active ? "text-white/80" : "text-lo"}`}>
                    <Calendar size={11} /> {m.meeting_date}
                    {m.attendees && (
                      <>
                        <span>·</span>
                        <Users size={11} />
                        <span className="truncate">{m.attendees}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detail */}
        <main className="flex-1 bg-panel border border-line rounded-2xl flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-lo">
              Pick a meeting on the left, or create a new one.
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-line flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-hi font-semibold truncate">{selected.title}</div>
                  <div className="text-lo text-xs">
                    {selected.meeting_date} {selected.attendees && `· ${selected.attendees}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {mode === "view" ? (
                    <button
                      onClick={() => setMode("edit")}
                      className="flex items-center gap-1 text-xs font-semibold bg-sunken hover:bg-raised text-hi px-2.5 py-1.5 rounded-lg border border-line"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setDraft(selected);
                          setMode("view");
                        }}
                        className="flex items-center gap-1 text-xs font-semibold bg-sunken hover:bg-raised text-hi px-2.5 py-1.5 rounded-lg border border-line"
                      >
                        <X size={12} /> Cancel
                      </button>
                      <button
                        onClick={saveDraft}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                      >
                        <Save size={12} /> {saving ? "Saving…" : "Save"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteMeeting(selected.id)}
                    className="flex items-center gap-1 text-xs font-semibold bg-sunken hover:bg-raised text-rose-400 px-2.5 py-1.5 rounded-lg border border-line"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {mode === "edit" ? (
                  <EditForm draft={draft} setDraft={setDraft} />
                ) : (
                  <ViewMeeting meeting={selected} />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </Shell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-[11px] uppercase tracking-[0.18em] text-mid font-semibold mb-2">{label}</div>
      {children}
    </div>
  );
}

function ViewMeeting({ meeting }: { meeting: Meeting }) {
  const has = (s: string) => s && s.trim().length > 0;
  return (
    <div className="max-w-3xl">
      {meeting.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {meeting.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet/10 text-violet border border-violet/20"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {has(meeting.summary) && (
        <Section label="Summary">
          <Markdown source={meeting.summary} />
        </Section>
      )}
      {has(meeting.decisions) && (
        <Section label="Decisions">
          <Markdown source={meeting.decisions} />
        </Section>
      )}
      {has(meeting.next_steps) && (
        <Section label="Next steps">
          <Markdown source={meeting.next_steps} />
        </Section>
      )}
      {has(meeting.transcript) && (
        <div className="mb-6">
          <Collapsible
            title="Transcript / notes"
            subtitle={`${meeting.transcript.trim().split(/\s+/).length.toLocaleString()} words`}
            defaultOpen={false}
          >
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-sunken border border-line rounded-xl p-4 max-h-[60vh] overflow-y-auto">
              {meeting.transcript}
            </div>
          </Collapsible>
        </div>
      )}
      {has(meeting.source) && (
        <Section label="Source">
          <div className="text-xs text-lo">{meeting.source}</div>
        </Section>
      )}
      {!has(meeting.summary) &&
        !has(meeting.transcript) &&
        !has(meeting.decisions) &&
        !has(meeting.next_steps) && (
          <div className="text-lo text-sm">Empty meeting — click Edit to add notes.</div>
        )}
    </div>
  );
}

const inputCls =
  "w-full bg-sunken border border-line rounded-lg px-3 py-2 text-sm text-hi placeholder:text-lo focus:outline-none focus:border-brand-500";

function EditForm({
  draft,
  setDraft,
}: {
  draft: Partial<Meeting>;
  setDraft: (d: Partial<Meeting>) => void;
}) {
  const set = <K extends keyof Meeting>(k: K, v: Meeting[K]) => setDraft({ ...draft, [k]: v });
  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-[1fr_180px] gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.14em] text-mid font-semibold mb-1.5">
            Title
          </label>
          <input
            className={inputCls}
            value={draft.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. James Tsikerdanos sales sync"
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.14em] text-mid font-semibold mb-1.5">
            Date
          </label>
          <input
            type="date"
            className={inputCls}
            value={draft.meeting_date ?? ""}
            onChange={(e) => set("meeting_date", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-[0.14em] text-mid font-semibold mb-1.5">
          Attendees
        </label>
        <input
          className={inputCls}
          value={draft.attendees ?? ""}
          onChange={(e) => set("attendees", e.target.value)}
          placeholder="Jevoy Palmer, James Tsikerdanos"
        />
      </div>
      {(
        [
          ["summary", "Summary", 4],
          ["decisions", "Decisions", 3],
          ["next_steps", "Next steps", 4],
          ["transcript", "Transcript / raw notes", 14],
          ["source", "Source (link, tool, etc.)", 2],
        ] as const
      ).map(([key, label, rows]) => (
        <div key={key}>
          <label className="block text-[11px] uppercase tracking-[0.14em] text-mid font-semibold mb-1.5">
            {label}
          </label>
          <textarea
            className={inputCls + " font-mono leading-relaxed"}
            rows={rows}
            value={(draft[key] as string) ?? ""}
            onChange={(e) => set(key, e.target.value as never)}
          />
        </div>
      ))}
    </div>
  );
}