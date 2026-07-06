import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listScripts from "./tools/list-scripts";
import getScript from "./tools/get-script";
import listChecklistItems from "./tools/list-checklist-items";
import toggleChecklistItem from "./tools/toggle-checklist-item";
import addChecklistItem from "./tools/add-checklist-item";

// The OAuth issuer must be the direct Supabase host (not the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined at build time by Vite.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "palmer-house-os-mcp",
  title: "Palmer House Production OS",
  version: "0.1.0",
  instructions:
    "Tools for the Palmer House Production OS. Read and manage scripts in the Studio library and items on production checklists.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listScripts, getScript, listChecklistItems, toggleChecklistItem, addChecklistItem],
});