import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-ink-900/80 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  title,
  description,
  action,
}: {
  className?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5",
        accent && "border-gold/30 gold-ring",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-zinc-50">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              accent
                ? "border-gold/30 bg-gold/10 text-gold"
                : "border-line bg-ink-800 text-zinc-400",
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
