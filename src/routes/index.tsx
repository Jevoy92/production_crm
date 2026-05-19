import { createFileRoute, redirect } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const role = useStore.getState().activeRole;
    throw redirect({
      to: role === "cfo" ? "/kpis/cfo" : role === "pa" ? "/kpis/pa" : "/kpis/owner",
    });
  },
  component: () => null,
});
