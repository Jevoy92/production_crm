import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthGate } from "@/components/AuthGate";

function NotFoundComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(900px 500px at 20% -10%, var(--ph-primary-soft), transparent 60%), var(--ph-app-bg)",
      }}
    >
      <div className="max-w-md text-center">
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            background: "linear-gradient(150deg, var(--ph-primary-500), var(--ph-primary-700))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>
        <h2 style={{ marginTop: 16, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Page not found</h2>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ph-text-secondary)" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link to="/" className="ph-btn ph-btn-primary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(900px 500px at 20% -10%, var(--ph-danger-soft), transparent 60%), var(--ph-app-bg)",
      }}
    >
      <div className="max-w-md text-center">
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>This page didn't load</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--ph-text-secondary)" }}>
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="ph-btn ph-btn-primary"
          >
            Try again
          </button>
          <a href="/" className="ph-btn ph-btn-soft">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Palmer House Production OS" },
      {
        name: "description",
        content: "Internal production dashboard for Palmer House Productions — projects, checklists, KPIs, and playbook.",
      },
      { name: "author", content: "Palmer House Productions" },
      { property: "og:title", content: "Palmer House Production OS" },
      {
        property: "og:description",
        content: "Internal production dashboard for Palmer House Productions.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const themeInitScript = `(function(){try{var t=localStorage.getItem('po-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}})();`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Outlet />
      </AuthGate>
    </QueryClientProvider>
  );
}
