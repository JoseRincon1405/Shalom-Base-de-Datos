import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

async function RootRedirect() {
  const user = await getCurrentUser();
  redirect(user ? (user.rol === "ADMIN" ? "/admin" : "/pos") : "/login");
  return null;
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <p className="text-sm text-muted">Cargando inFlow…</p>
          </div>
        </main>
      }
    >
      <RootRedirect />
    </Suspense>
  );
}
