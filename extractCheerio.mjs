// Extract playbooks from PHP_Playbooks_Hub.html → src/lib/playbooksSeed.ts
// Run via: npm run seed:playbooks
//
// Handles: accordions, tables, copy-blocks, checklists, callouts, asides, meta-cards,
// Pal character cards (with images + pod type), and maps everything to the proper
// PlaybookPage fields (whenToUse / inputsNeeded / definitionOfDone / commonMistakes /
// relatedStage / relatedPalType / imageUrl / loomUrl).

import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

const HTML_PATH =
  "/Users/jevoypalmer/Documents/Antigravity_Projects/Palmer House Productions/CRM/PHP_Playbooks_Hub.html";
const OUT_PATH = path.resolve("src/lib/playbooksSeed.ts");

const html = fs.readFileSync(HTML_PATH, "utf-8");
const $ = cheerio.load(html);

// ─── Category → loops, stage, owner ──────────────────────────────────────────

const CAT_META = {
  pre:      { loops: ["Prep Loop", "Sales Loop"],                stage: "Pre-Production", owner: "owner" },
  prod:     { loops: ["Prep Loop", "Shoot Day Loop"],            stage: "Pre-Production", owner: "owner" },
  onset:    { loops: ["Shoot Day Loop", "Gear Loop"],            stage: "Shoot Day",      owner: "owner" },
  post:     { loops: ["Edit Handoff Loop"],                      stage: "In Post",        owner: "company" },
  delivery: { loops: ["Delivery Loop", "Sales Loop"],            stage: "Delivered",      owner: "owner" },
  pals:     { loops: ["Content Loop", "Sales Loop"],             stage: "Pre-Production", owner: "company" },
  brand:    { loops: ["Content Loop"],                           stage: "Pre-Production", owner: "company" },
  ai:       { loops: ["Internal Training Loop", "Content Loop"], stage: "Pre-Production", owner: "company" },
  files:    { loops: ["Edit Handoff Loop", "Internal Training Loop"], stage: "In Post",   owner: "pa" },
  training: { loops: ["Internal Training Loop"],                 stage: "Pre-Production", owner: "owner" },
};

const POD_TO_PAL_TYPE = {
  visibility: "Visibility",
  youtube:    "YouTube",
  commercial: "Commercial",
  systems:    "Systems",
};

// ─── HTML → Markdown helpers ─────────────────────────────────────────────────

function preInnerToMarkdown($pre) {
  // Preserve <strong> inside <pre>, drop other tags, decode entities.
  let md = "";
  $pre.contents().each((_, node) => {
    if (node.type === "text") {
      md += node.data;
    } else if (node.type === "tag") {
      const t = $(node).text();
      if (node.name === "strong" || node.name === "b") {
        md += `**${t}**`;
      } else {
        md += t;
      }
    }
  });
  return md.trim();
}

function copyBlockToMarkdown($cb) {
  const rawLabel = $cb.find(".copy-block__label").text().trim();
  const label = rawLabel.replace(/^\/\/\s*/, "");
  const $pre = $cb.find("pre");
  if (!$pre.length) return "";
  const body = preInnerToMarkdown($pre);
  return `**${label || "Copy block"}**\n\n\`\`\`\n${body}\n\`\`\`\n\n`;
}

function tableToMarkdown($table) {
  const headers = $table
    .find("thead tr th")
    .map((_, th) => $(th).text().trim())
    .get();
  if (headers.length === 0) return "";

  let md = `\n| ${headers.join(" | ")} |\n`;
  md += `| ${headers.map(() => "---").join(" | ")} |\n`;

  $table.find("tbody tr").each((_, tr) => {
    const cells = $(tr)
      .find("td")
      .map((_, td) => {
        const $td = $(td);
        // Convert <b>/<strong> → **
        let cellHtml = $td.html() || "";
        cellHtml = cellHtml.replace(/<(b|strong)>/g, "**").replace(/<\/(b|strong)>/g, "**");
        cellHtml = cellHtml.replace(/<[^>]+>/g, "");
        cellHtml = cellHtml
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, " ");
        return cellHtml.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
      })
      .get();
    md += `| ${cells.join(" | ")} |\n`;
  });
  return md + "\n";
}

function checklistUlToMarkdown($ul) {
  let md = "";
  $ul.children("li").each((_, li) => {
    const $li = $(li);
    const span = $li.children("span").text().trim();
    const small = $li.children("small").text().trim();
    const text = span || $li.text().replace(/\s+/g, " ").trim();
    md += `- [ ] ${text}${small ? ` _(${small})_` : ""}\n`;
  });
  return md + "\n";
}

function swatchGridToMarkdown($grid) {
  let md = "";
  $grid.find(".swatch").each((_, sw) => {
    const $sw = $(sw);
    const name = $sw.find(".swatch__name").text().trim();
    const role = $sw.find(".swatch__role").text().trim();
    const hex = $sw.attr("data-hex");
    if (name && hex) {
      md += `- **${name}** — \`${hex}\` _(${role})_\n`;
    }
  });
  return md + "\n";
}

function nodeToMarkdown($scope) {
  let md = "";
  $scope.contents().each((_, node) => {
    if (node.type === "text") {
      const t = node.data;
      // Skip pure-whitespace text nodes that just exist between block elements
      if (/^\s*$/.test(t)) return;
      md += t.replace(/\s+/g, " ");
      return;
    }
    if (node.type !== "tag") return;

    const $el = $(node);
    const tag = node.name;

    switch (tag) {
      case "details": {
        const summary = $el.find("summary").first().text().trim();
        const $inner = $el.find(".acc__inner").first();
        if (summary) md += `\n## ${summary}\n\n`;
        md += $inner.length ? nodeToMarkdown($inner) : nodeToMarkdown($el);
        break;
      }
      case "summary":
        // already handled by parent <details>
        break;
      case "h3":
        md += `\n## ${$el.text().trim()}\n\n`;
        break;
      case "h4":
        md += `\n### ${$el.text().trim()}\n\n`;
        break;
      case "h5":
        md += `\n#### ${$el.text().trim()}\n\n`;
        break;
      case "p":
        md += `${nodeToMarkdown($el).trim()}\n\n`;
        break;
      case "strong":
      case "b":
        md += `**${$el.text()}**`;
        break;
      case "em":
      case "i":
        md += `*${$el.text()}*`;
        break;
      case "br":
        md += "\n";
        break;
      case "blockquote": {
        const bq = nodeToMarkdown($el).trim();
        md += "\n" + bq.split("\n").map((l) => `> ${l}`).join("\n") + "\n\n";
        break;
      }
      case "ul":
        if ($el.hasClass("checklist")) {
          md += checklistUlToMarkdown($el);
        } else {
          $el.children("li").each((_, li) => {
            const $li = $(li);
            const span = $li.children("span").text().trim();
            const small = $li.children("small").text().trim();
            const text = span || $li.text().replace(/\s+/g, " ").trim();
            md += `- ${text}${small ? ` _(${small})_` : ""}\n`;
          });
          md += "\n";
        }
        break;
      case "ol":
        $el.children("li").each((i, li) => {
          md += `${i + 1}. ${$(li).text().replace(/\s+/g, " ").trim()}\n`;
        });
        md += "\n";
        break;
      case "table":
        md += tableToMarkdown($el);
        break;
      case "pre":
        md += "\n```\n" + preInnerToMarkdown($el) + "\n```\n\n";
        break;
      case "div":
        if ($el.hasClass("copy-block")) {
          md += copyBlockToMarkdown($el);
        } else if ($el.hasClass("swatch-grid")) {
          md += swatchGridToMarkdown($el);
        } else if ($el.hasClass("callout")) {
          const label = $el.find(".callout__label").text().trim();
          const text = $el.find(".callout__text").text().trim();
          if (text) md += `\n> **${label}** — ${text}\n\n`;
        } else {
          md += nodeToMarkdown($el);
        }
        break;
      default:
        md += nodeToMarkdown($el);
    }
  });
  return md;
}

// ─── Aside / callout extraction ──────────────────────────────────────────────

function extractAside($pb) {
  const result = {
    whenToUse: "",
    trigger: "",
    inputsNeeded: "",
    definitionOfDone: "",
    commonMistakes: "",
    loomUrl: "",
    loomTitle: "",
  };

  // Meta-cards
  $pb.find(".meta-card").each((_, card) => {
    const $card = $(card);
    const label = $card.find("h5").text().trim().toLowerCase();
    let body = "";
    const $ul = $card.find("ul");
    if ($ul.length) {
      body = $ul.find("li").map((_, li) => `• ${$(li).text().trim()}`).get().join("  ");
    } else {
      body = $card.find("p").text().trim();
    }
    if (!body) return;

    if (/when to use/.test(label) || /timing/.test(label)) {
      result.whenToUse = appendField(result.whenToUse, body);
    } else if (/tools/.test(label) || /attach/.test(label) || /where it lives/.test(label) || /hosting/.test(label)) {
      result.inputsNeeded = appendField(result.inputsNeeded, body);
    } else if (/owner/.test(label) || /escalation/.test(label) || /auto-disqualifies/.test(label) || /progression/.test(label) || /two-drive rule/.test(label) || /pro tip/.test(label)) {
      result.trigger = appendField(result.trigger, `${label}: ${body}`);
    }
  });

  // Callouts
  $pb.find(".callout").each((_, c) => {
    const $c = $(c);
    const label = $c.find(".callout__label").text().trim();
    const text = $c.find(".callout__text").text().trim();
    if (!text) return;
    const line = label ? `**${label}** — ${text}` : text;

    if ($c.hasClass("callout--warn")) {
      result.commonMistakes = appendField(result.commonMistakes, line);
    } else if ($c.hasClass("callout--good")) {
      result.definitionOfDone = appendField(result.definitionOfDone, line);
    } else {
      // Neutral callouts → whenToUse if empty, otherwise definitionOfDone
      if (!result.whenToUse) result.whenToUse = appendField(result.whenToUse, line);
      else result.definitionOfDone = appendField(result.definitionOfDone, line);
    }
  });

  // Loom placeholder
  const $loom = $pb.find(".loom").first();
  if ($loom.length) {
    result.loomTitle = $loom.find(".loom__title").text().trim();
  }

  return result;
}

function appendField(existing, addition) {
  if (!addition) return existing;
  if (!existing) return addition;
  return `${existing}\n\n${addition}`;
}

// ─── Slug helpers ────────────────────────────────────────────────────────────

const SLUG_REMAP = {
  "strategy-call": "strategy-call",
  intake: "intake-form-questions",
  qual: "qualification-rubric",
  pricing: "pricing-talk-track",
  "explain-pals": "explain-the-pals",
  shy: "camera-shy-clients",
  wardrobe: "wardrobe-guide",
  location: "location-scouting",
  "script-fmt": "script-formatting",
  "prep-email": "client-prep-email",
  callsheet: "call-sheet",
  "shoot-brief": "shoot-brief",
  greeting: "client-greeting",
  "gear-setup": "gear-setup",
  trouble: "on-set-troubleshooting",
  "cam-audio": "camera-audio-checklist",
  wrap: "wrap-process",
  folders: "folder-structure",
  naming: "naming-conventions",
  "edit-workflow": "edit-workflow",
  revisions: "revision-policy",
  handoff: "final-handoff",
  "asset-lib": "asset-library",
  touchpoints: "post-delivery-touchpoints",
  testimonial: "testimonial-request",
  "next-offer": "next-offer",
  "pal-framework": "pal-framework",
  voice: "palmer-house-voice",
  colors: "brand-colors",
  "ai-prompts": "ai-prompt-library",
  "ai-credits": "ai-credits-policy",
  drive: "drive-structure",
  backup: "backup-policy",
  onboarding: "onboarding-day-1",
  shadow: "shadow-shoot-rules",
};

function normalizeSlug(raw) {
  const cleaned = raw.replace(/^pb-/, "");
  return SLUG_REMAP[cleaned] || cleaned;
}

// ─── Main extraction ─────────────────────────────────────────────────────────

const playbooks = [];
let orderCounter = 0;

$("section.section").each((_, section) => {
  const catId = $(section).attr("data-cat");
  if (!catId || !CAT_META[catId]) return;
  const meta = CAT_META[catId];

  // Regular playbook articles
  $(section)
    .find("article.pb")
    .each((j, pb) => {
      const $pb = $(pb);
      const slug = normalizeSlug($pb.attr("id") || `pb_${catId}_${j}`);
      const title = $pb.find(".pb__main h3").text().trim() || "Untitled";
      const purpose = $pb.find(".pb__main p").text().trim();

      // Walk the body, but skip the aside (we extract that separately).
      const $body = $pb.find(".pb__body").first();
      const $bodyClone = $body.clone();
      $bodyClone.find(".pb__aside").remove();

      // Walk the body as a single scope — nodeToMarkdown handles every shape
      // we use (details/summary accordions, tables, callouts, copy-blocks,
      // swatch grids, lists, paragraphs, headings, blockquotes).
      let content = nodeToMarkdown($bodyClone);

      // Checklist items (structured field — separate from content markdown)
      const checklist = [];
      $pb.find("ul.checklist li").each((k, li) => {
        const $li = $(li);
        const span = $li.children("span").text().trim();
        const small = $li.children("small").text().trim();
        const text = span || $li.text().replace(/\s+/g, " ").trim();
        if (text) {
          checklist.push({
            id: `${slug}_chk_${k}`,
            text: small ? `${text} (${small})` : text,
            done: false,
          });
        }
      });

      const aside = extractAside($pb);

      // Clean up double blank lines and trim
      content = content.replace(/\n{3,}/g, "\n\n").trim();

      playbooks.push({
        slug,
        title,
        loops: meta.loops,
        purpose,
        ownerRole: meta.owner,
        whenToUse: aside.whenToUse,
        trigger: aside.trigger,
        inputsNeeded: aside.inputsNeeded,
        content,
        checklist,
        definitionOfDone: aside.definitionOfDone,
        commonMistakes: aside.commonMistakes,
        relatedStage: meta.stage,
        order: orderCounter++,
      });
    });

  // Pal character cards
  $(section)
    .find(".pal-card")
    .each((_, pal) => {
      const $pal = $(pal);
      const name = $pal.find(".pal-card__name").text().trim();
      if (!name) return;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const role = $pal.find(".pal-card__role").text().trim();
      const desc = $pal.find(".pal-card__desc").text().trim();
      const pod = $pal.attr("data-type");
      const palType = POD_TO_PAL_TYPE[pod];
      const imgSrc = $pal.find("img").attr("src") || "";
      const imageUrl = imgSrc ? `/${imgSrc.replace(/^\.?\/?/, "")}` : "";

      // Stats grid
      const stats = {};
      $pal.find(".pal-card__stats > div").each((_, div) => {
        const $div = $(div);
        const label = $div.find("b").text().trim();
        const $clone = $div.clone();
        $clone.find("b").remove();
        const value = $clone.text().trim();
        if (label) stats[label] = value;
      });

      const content = [
        `## Role`,
        ``,
        `**${role}**`,
        ``,
        `## How They Show Up`,
        ``,
        desc,
        ``,
        `## Deployment`,
        ``,
        `| Dimension | Detail |`,
        `| --- | --- |`,
        `| Best for | ${stats["Best for"] || "—"} |`,
        `| Pace | ${stats["Pace"] || "—"} |`,
        `| Length | ${stats["Length"] || "—"} |`,
        `| Avoid | ${stats["Avoid"] || "—"} |`,
        ``,
      ].join("\n");

      playbooks.push({
        slug,
        title: `${name} — ${palType || "Pal"} Pal`,
        loops: meta.loops,
        purpose: role,
        ownerRole: meta.owner,
        whenToUse: stats["Best for"] || "",
        trigger: "",
        inputsNeeded: stats["Pace"] ? `Pace: ${stats["Pace"]} · Length: ${stats["Length"]}` : "",
        content,
        checklist: [],
        definitionOfDone: "",
        commonMistakes: stats["Avoid"] || "",
        relatedStage: meta.stage,
        relatedPalType: palType,
        imageUrl,
        order: orderCounter++,
      });
    });
});

// ─── Emit TypeScript ─────────────────────────────────────────────────────────

const header = `// AUTO-GENERATED by extractCheerio.mjs — do not edit by hand.
// Re-generate with: npm run seed:playbooks
import type { PlaybookPage } from "./types";

// Deterministic "updatedAt" — newer entries first. Stamps every entry roughly
// one day apart, anchored at extraction time, so the seed is stable across runs.
const ANCHOR = new Date("2026-05-18T12:00:00Z").getTime();
const stamp = (i: number) => new Date(ANCHOR - i * 86400000).toISOString();

export const PLAYBOOK: PlaybookPage[] = [
`;

let body = "";
playbooks.forEach((p) => {
  const fields = [
    `    slug: ${JSON.stringify(p.slug)},`,
    `    title: ${JSON.stringify(p.title)},`,
    `    loops: ${JSON.stringify(p.loops)},`,
    `    purpose: ${JSON.stringify(p.purpose)},`,
    `    ownerRole: ${JSON.stringify(p.ownerRole)},`,
    `    whenToUse: ${JSON.stringify(p.whenToUse)},`,
    `    trigger: ${JSON.stringify(p.trigger)},`,
    `    inputsNeeded: ${JSON.stringify(p.inputsNeeded)},`,
    `    content: ${JSON.stringify(p.content)},`,
    `    checklist: ${JSON.stringify(p.checklist)},`,
    `    definitionOfDone: ${JSON.stringify(p.definitionOfDone)},`,
    `    commonMistakes: ${JSON.stringify(p.commonMistakes)},`,
    `    relatedStage: ${JSON.stringify(p.relatedStage)},`,
  ];
  if (p.relatedPalType) fields.push(`    relatedPalType: ${JSON.stringify(p.relatedPalType)},`);
  if (p.imageUrl) fields.push(`    imageUrl: ${JSON.stringify(p.imageUrl)},`);
  fields.push(`    updatedAt: stamp(${p.order}),`);

  body += `  {\n${fields.join("\n")}\n  },\n`;
});

const out = header + body + "];\n";

fs.writeFileSync(OUT_PATH, out);
console.log(`✓ Extracted ${playbooks.length} playbooks → ${OUT_PATH}`);
console.log(`  - ${playbooks.filter((p) => p.checklist.length).length} with checklists`);
console.log(`  - ${playbooks.filter((p) => p.imageUrl).length} with images (Pals)`);
console.log(`  - ${playbooks.filter((p) => p.whenToUse).length} with whenToUse`);
console.log(`  - ${playbooks.filter((p) => p.commonMistakes).length} with commonMistakes`);
console.log(`  - ${playbooks.filter((p) => p.definitionOfDone).length} with definitionOfDone`);
