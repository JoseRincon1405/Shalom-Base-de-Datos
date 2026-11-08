import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "gold"
  | "success"
  | "danger"
  | "warning"
  | "muted"
  | "info";

const VARIANTS: Record<BadgeVariant, string> = {
  gold: "border-gold/30 bg-gold/10 text-gold-soft",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  muted: "border-line bg-ink-800 text-zinc-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export function Badge({
  className,
  variant = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
