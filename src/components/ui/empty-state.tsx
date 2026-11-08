import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-ink-800 text-zinc-500">
        {icon ?? <PackageOpen className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
