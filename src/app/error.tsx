"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
        <TriangleAlert className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Algo salió mal
        </h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Ocurrió un error inesperado. Intenta nuevamente; si el problema
          persiste, revisa la conexión con la base de datos.
        </p>
        {error.digest ? (
          <p className="mt-2 text-[11px] text-zinc-600">
            Referencia: {error.digest}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-gold-soft"
      >
        <RotateCcw className="h-4 w-4" />
        Reintentar
      </button>
    </main>
  );
}
