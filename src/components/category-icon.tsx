import { CATEGORY_META } from "@/lib/constants";
import type { SystemCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryIcon({
  category,
  size = "md",
  className,
}: {
  category: SystemCategory;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
        meta.tile,
        size === "sm" && "h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5",
        size === "md" && "h-9 w-9 [&_svg]:h-[18px] [&_svg]:w-[18px]",
        size === "lg" && "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5",
        className,
      )}
      aria-hidden
    >
      <Icon strokeWidth={1.75} />
    </span>
  );
}
