import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html || "");
}

export function markdownToHtml(md: string): string {
  return marked.parse(md || "", { async: false }) as string;
}