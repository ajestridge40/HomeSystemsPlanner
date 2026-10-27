import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-7 w-7", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-sage-600" />
      <path
        d="M9 15.2 16 9.5l7 5.7V22a1 1 0 0 1-1 1h-3.5v-4.5h-5V23H10a1 1 0 0 1-1-1v-6.8Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="9.5" r="2.5" className="fill-amber-200" />
    </svg>
  );
}

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={compact ? "h-6 w-6" : undefined} />
      <span className={cn("font-semibold tracking-tight", compact ? "text-sm" : "text-[15px]")}>Home Continuity</span>
    </span>
  );
}
