I found the actual failure: the page first tries a dynamic markdown chunk, which is failing to fetch, then falls back to `/hubs/scripts/...`, but that public URL is returning 404. The bulletproof fix is to remove runtime markdown loading from this page entirely.

Plan:

1. Replace lazy markdown loading with a compile-time script library
- Convert all script markdown files into plain text strings bundled directly into the app at build time.
- Use `import.meta.glob(..., { eager: true, query: '?raw' })` so every script body is available synchronously with no dynamic chunk request.
- Keep the same existing script titles, brand versions, search, filters, copy, and `.md` download behavior.

2. Update the scripts page rendering
- Stop calling `useLazySource` for the main script dropdowns.
- When a version is selected, render its bundled plain-text body immediately.
- If a script is missing from the library, show a clear “version not available” state instead of “couldn’t load.”

3. Keep markdown formatting safe but no longer dependent on files loading
- For display, pass the bundled text into the existing Markdown renderer, so headings/lists still look right.
- If you prefer truly plain text display, I can render inside a pre-wrapped document view instead, but the permanent loading fix does not require that.

4. Fix the broken backup links
- Replace the current encoded public fallback links with working source-aware links or remove the “Original” button from loaded dropdown content if it points to unavailable files.
- This prevents the UI from offering a link that 404s.

5. Leave reference documents alone unless needed
- Apply this bulletproof approach to the script dropdowns first, because that is the broken user-facing flow.
- Strategy / Research / Manual pages can stay lazy for now, or I can convert those too in a follow-up if you want the same no-runtime-fetch guarantee across all docs.

Technical details:
- Main edit target: `src/lib/scriptsIndex.ts` to make script entries include `body` instead of `load` for script versions.
- Main UI target: `src/routes/scripts.tsx` to render `entry.body` directly.
- Optional cleanup: keep `useLazySource` only for non-script document readers, or remove it later if no longer used.

Result:
- No dynamic script chunk requests.
- No `/hubs/scripts/*.md` fetch dependency.
- No “couldn’t load this script” for bundled scripts.
- Script dropdowns work permanently from the app bundle itself.