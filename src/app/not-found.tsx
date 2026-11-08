import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-semibold tracking-tight text-gold">404</p>
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">
          Página no encontrada
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          La ruta que buscas no existe o fue movida.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
