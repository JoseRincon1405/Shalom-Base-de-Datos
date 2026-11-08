import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { Spinner } from "@/components/ui/spinner";
import { requireUser } from "@/lib/auth";
import { getTasaActual } from "@/lib/data";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const tasa = await getTasaActual();

  return (
    <AppShell user={user} initialTasa={tasa}>
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted">Preparando tu espacio de trabajo…</p>
        </div>
      }
    >
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
