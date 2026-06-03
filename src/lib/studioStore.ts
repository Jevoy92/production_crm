import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Local-first Studio store. Scripts are scene-structured (matching the Studio
 * editor design) and persisted to localStorage. This intentionally does NOT
 * depend on the Supabase service-role key (which isn't provisioned), so the
 * editor works as a full preview. The AI panel is wired for a connected model
 * later; for now it returns a friendly "not connected" reply.
 */

export type SceneBlock =
  | { id: string; type: "action"; text: string }
  | { id: string; type: "vo"; speaker: string; text: string };

export type Scene = {
  id: string;
  code: string; // "SC 01"
  heading: string; // "INT. OPEN PLAN OFFICE — DAY"
  timecode?: string; // "0:00 – 0:28"
  blocks: SceneBlock[];
};

export type StudioMessage = { id: string; role: "user" | "assistant"; content: string; ts: number };

export type StudioScript = {
  id: string;
  title: string;
  brand: string;
  status: string; // "Draft" | "Client Approved" | ...
  version: string; // "v1.0"
  scenes: Scene[];
  messages: StudioMessage[];
  updatedAt: number;
  createdAt: number;
};

export const STUDIO_BRANDS = [
  { value: "jevoy", label: "Jevoy Palmer" },
  { value: "palmer-house", label: "Palmer House" },
  { value: "mindyourbizniz", label: "MindYourBizniz" },
  { value: "original", label: "Original" },
];

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export function wordCount(s: StudioScript): number {
  return s.scenes.reduce(
    (a, sc) => a + sc.blocks.reduce((b, bl) => b + (bl.text.trim() ? bl.text.trim().split(/\s+/).length : 0), 0),
    0,
  );
}
export function runtimeEstimate(s: StudioScript): string {
  const w = wordCount(s);
  const secs = Math.round((w / 150) * 60); // ~150 wpm narration
  const m = Math.floor(secs / 60);
  const sec = secs % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function starterScenes(): Scene[] {
  return [
    {
      id: uid("sc"),
      code: "SC 01",
      heading: "INT. LOCATION — DAY",
      timecode: "0:00 – 0:20",
      blocks: [
        { id: uid("bl"), type: "action", text: "Open on a single, specific moment. Describe what we see — keep it grounded and visual." },
        { id: uid("bl"), type: "vo", speaker: "NARRATOR (V.O.)", text: "Open with the hook. One sharp line that frames the whole piece." },
      ],
    },
    {
      id: uid("sc"),
      code: "SC 02",
      heading: "INT. LOCATION — CONTINUOUS",
      timecode: "0:20 – 0:50",
      blocks: [{ id: uid("bl"), type: "action", text: "Develop the idea. Add the turn — the moment something shifts." }],
    },
  ];
}

function demoScript(): StudioScript {
  const t = Date.now();
  return {
    id: "demo-google-ai-vision",
    title: "Google — AI Everywhere Product Vision Film",
    brand: "original",
    status: "Client Approved",
    version: "v3.2",
    createdAt: t,
    updatedAt: t,
    scenes: [
      {
        id: uid("sc"),
        code: "SC 01",
        heading: "INT. OPEN PLAN OFFICE — DAY",
        timecode: "0:00 – 0:28",
        blocks: [
          { id: uid("bl"), type: "action", text: "A vast modern office. Dozens of people at screens — overwhelmed. Data floods in. Notifications stack. The hum of a world moving too fast. A woman stares at three monitors, hands pressed to her temples." },
          { id: uid("bl"), type: "vo", speaker: "NARRATOR (V.O.)", text: "Every day, the world generates more data than we can process. More decisions than we can make. More complexity than any one person — or team — can handle alone." },
          { id: uid("bl"), type: "action", text: "The camera pulls back. The office becomes one window in a thousand. Cities. Hospitals. Schools. All spinning at the edge of overwhelm." },
        ],
      },
      {
        id: uid("sc"),
        code: "SC 02",
        heading: "INT. GOOGLE RESEARCH LAB — NIGHT",
        timecode: "0:28 – 1:05",
        blocks: [
          { id: uid("bl"), type: "action", text: "Soft blue light. Servers hum quietly. A researcher types — and something responds. Not just data. Understanding. On screen: Gemini. The interface breathes." },
          { id: uid("bl"), type: "vo", speaker: "DR. CHEN (ON CAMERA)", text: "We didn't build Gemini to replace thinking. We built it to amplify it. To take the noise — and find the signal." },
          { id: uid("bl"), type: "action", text: "Close-up: fingers on a keyboard. Then: a visualization blooms — networks of light connecting concepts, people, problems. Beautiful. Purposeful." },
        ],
      },
      {
        id: uid("sc"),
        code: "SC 03",
        heading: "EXT. VARIOUS LOCATIONS — DAY",
        timecode: "1:05 – 2:00",
        blocks: [
          { id: uid("bl"), type: "action", text: "A montage of human moments. A doctor reviewing scans — AI flags an anomaly she almost missed. A farmer checking crop data — AI predicts drought, two weeks early. A teacher adapting a lesson in real time for a student who's struggling." },
          { id: uid("bl"), type: "vo", speaker: "NARRATOR (V.O.)", text: "AI isn't everywhere because we put it there. It's everywhere because that's where people needed it most." },
        ],
      },
    ],
    messages: [
      { id: uid("m"), role: "assistant", content: "I've analyzed the full script. Scene 01 is strong — the office overwhelm opening is cinematic and emotionally grounded. A few suggestions: add a specific number in the V.O. for impact; name 3 distinct sectors in the pullback; consider a sound-design note — \"the hum becomes a roar\" before the cut.", ts: t },
    ],
  };
}

type StudioState = {
  scripts: StudioScript[];
  createScript: (init?: Partial<StudioScript>) => string;
  deleteScript: (id: string) => void;
  patchScript: (id: string, patch: Partial<StudioScript>) => void;
  addScene: (scriptId: string) => string;
  updateScene: (scriptId: string, sceneId: string, patch: Partial<Scene>) => void;
  removeScene: (scriptId: string, sceneId: string) => void;
  updateBlock: (scriptId: string, sceneId: string, blockId: string, text: string) => void;
  addBlock: (scriptId: string, sceneId: string, type: SceneBlock["type"]) => void;
  removeBlock: (scriptId: string, sceneId: string, blockId: string) => void;
  addMessage: (scriptId: string, m: Omit<StudioMessage, "id" | "ts">) => void;
  clearMessages: (scriptId: string) => void;
};

const touch = (s: StudioScript): StudioScript => ({ ...s, updatedAt: Date.now() });

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      scripts: [demoScript()],
      createScript: (init) => {
        const id = uid("scr");
        const t = Date.now();
        const script: StudioScript = {
          id, title: init?.title ?? "Untitled script", brand: init?.brand ?? "jevoy",
          status: "Draft", version: "v1.0", scenes: init?.scenes ?? starterScenes(),
          messages: [], createdAt: t, updatedAt: t, ...init,
        };
        set({ scripts: [script, ...get().scripts] });
        return id;
      },
      deleteScript: (id) => set({ scripts: get().scripts.filter((s) => s.id !== id) }),
      patchScript: (id, patch) => set({ scripts: get().scripts.map((s) => (s.id === id ? touch({ ...s, ...patch }) : s)) }),
      addScene: (scriptId) => {
        const newId = uid("sc");
        set({
          scripts: get().scripts.map((s) => {
            if (s.id !== scriptId) return s;
            const n = s.scenes.length + 1;
            return touch({
              ...s,
              scenes: [...s.scenes, { id: newId, code: `SC ${String(n).padStart(2, "0")}`, heading: "INT. NEW SCENE — DAY", timecode: "", blocks: [{ id: uid("bl"), type: "action", text: "" }] }],
            });
          }),
        });
        return newId;
      },
      updateScene: (scriptId, sceneId, patch) =>
        set({ scripts: get().scripts.map((s) => s.id !== scriptId ? s : touch({ ...s, scenes: s.scenes.map((sc) => sc.id === sceneId ? { ...sc, ...patch } : sc) })) }),
      removeScene: (scriptId, sceneId) =>
        set({ scripts: get().scripts.map((s) => s.id !== scriptId ? s : touch({ ...s, scenes: s.scenes.filter((sc) => sc.id !== sceneId) })) }),
      updateBlock: (scriptId, sceneId, blockId, text) =>
        set({ scripts: get().scripts.map((s) => s.id !== scriptId ? s : touch({ ...s, scenes: s.scenes.map((sc) => sc.id !== sceneId ? sc : { ...sc, blocks: sc.blocks.map((bl) => bl.id === blockId ? { ...bl, text } : bl) }) })) }),
      addBlock: (scriptId, sceneId, type) =>
        set({ scripts: get().scripts.map((s) => s.id !== scriptId ? s : touch({ ...s, scenes: s.scenes.map((sc) => sc.id !== sceneId ? sc : { ...sc, blocks: [...sc.blocks, type === "vo" ? { id: uid("bl"), type: "vo", speaker: "NARRATOR (V.O.)", text: "" } : { id: uid("bl"), type: "action", text: "" }] }) })) }),
      removeBlock: (scriptId, sceneId, blockId) =>
        set({ scripts: get().scripts.map((s) => s.id !== scriptId ? s : touch({ ...s, scenes: s.scenes.map((sc) => sc.id !== sceneId ? sc : { ...sc, blocks: sc.blocks.filter((bl) => bl.id !== blockId) }) })) }),
      addMessage: (scriptId, m) =>
        set({ scripts: get().scripts.map((s) => s.id !== scriptId ? s : { ...s, messages: [...s.messages, { id: uid("m"), ts: Date.now(), ...m }] }) }),
      clearMessages: (scriptId) =>
        set({ scripts: get().scripts.map((s) => s.id !== scriptId ? s : { ...s, messages: [] }) }),
    }),
    { name: "studio:v1", version: 1 },
  ),
);
