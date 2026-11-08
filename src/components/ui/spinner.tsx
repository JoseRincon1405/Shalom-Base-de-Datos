import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-gold/25 border-t-gold",
        className,
      )}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function PageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-7 w-7" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
