import { AppShell } from "@/components/app/AppShell";

export function Shell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AppShell title={title} subtitle={subtitle} actions={actions}>
      {children}
    </AppShell>
  );
}
