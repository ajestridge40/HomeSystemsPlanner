import { STATUS_META } from "@/lib/constants";
import type { SystemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: SystemStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function DueBadge({ days, className }: { days: number | null; className?: string }) {
  if (days === null) return null;
  const tone =
    days < 0
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : days <= 7
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : days <= 30
          ? "bg-sky-50 text-sky-700 ring-sky-200"
          : "bg-muted text-muted-foreground ring-border";
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days}d`;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
