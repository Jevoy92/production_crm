## What's actually wrong

The published site at `productionphp.lovable.app` is broken — not the preview, and not "a different computer" issue.

The published JS bundle was built at a moment when the Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) were missing from the build environment. Because Vite inlines those at build time, the bundle now permanently throws this on load:

> [Supabase] Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY.

That throw happens inside the Supabase client proxy, which the root `<AuthGate>` calls immediately on mount. The error escapes to the root route's `errorComponent`, which is exactly the "This page didn't load / Try again / Go home" screen you screenshotted.

The preview (`id-preview--…lovable.app`) works because the sandbox has a healthy `.env` with both vars present.

## The fix

No code change is needed. The codebase, `.env`, and Cloud backend are all healthy right now. You just need to rebuild the published bundle so the current env vars get inlined.

1. Click **Publish → Update** in the top-right of the editor. This rebuilds with the current env and overwrites the broken `index-DviYBQZa.js` chunk.
2. Once it finishes (usually ~30s), open `https://productionphp.lovable.app` in an incognito window (to avoid any cached old chunk) and confirm the Palmer House "Welcome back" sign-in card appears instead of "This page didn't load".
3. Sign in with the shared team account — you should land on the Today dashboard.

## Why the error boundary masked it

The root `errorComponent` in `src/routes/__root.tsx` renders a friendly fallback for any thrown error during render. That's correct behavior — but it makes a missing-env crash look identical to a transient network error, which is why "Try again" never helps (the bundle is the bug, retrying re-runs the same bundle).

## Optional follow-up (not required for the fix)

If you want the published site to fail more loudly the next time env injection breaks, I can update `src/integrations/supabase/client.ts` to render a dedicated "Backend not connected — republish required" screen instead of throwing into the generic error boundary. Say the word and I'll do it after you republish.

<presentation-actions>
<presentation-open-publish>Publish your app</presentation-open-publish>
</presentation-actions>
