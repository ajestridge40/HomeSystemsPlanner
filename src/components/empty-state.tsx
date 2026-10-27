"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 text-center",
        compact ? "py-10" : "py-16",
        className,
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-sage-100/60 blur-md" aria-hidden />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border bg-card text-sage-600 shadow-soft">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground text-balance">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </motion.div>
  );
}
