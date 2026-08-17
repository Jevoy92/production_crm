import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/scripts/shorts")({
  // Shorts Lab merged into the single Shorts hub.
  beforeLoad: () => {
    throw redirect({ to: "/repurpose" });
  },
});
