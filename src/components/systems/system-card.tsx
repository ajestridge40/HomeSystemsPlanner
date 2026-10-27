"use client";

import { motion } from "framer-motion";
import { AlertCircle, CalendarClock, MapPin, UserRound } from "lucide-react";
import { useAppActions } from "@/components/app-actions";
import { CategoryIcon } from "@/components/category-icon";
import { DueBadge, StatusBadge } from "@/components/status-badge";
import { SystemActionsMenu } from "@/components/systems/system-actions-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORY_META } from "@/lib/constants";
import { daysUntil, formatDate, formatInterval, getMissingInfo, getNextDue } from "@/lib/domain";
import { useContactMap } from "@/lib/store";
import type { HomeSystem } from "@/lib/types";
import { cn } from "@/lib/utils";

function MissingIndicator({ system }: { system: HomeSystem }) {
  const missing = getMissingInfo(system);
  if (missing.length === 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <AlertCircle className="h-3.5 w-3.5" />
          {missing.length} missing
        </span>
      </TooltipTrigger>
      <TooltipContent>Missing: {missing.map((m) => m.label).join(", ")}</TooltipContent>
    </Tooltip>
  );
}

const itemMotion = {
  layout: true,
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.22, ease: "easeOut" },
} as const;

export function SystemCard({ system }: { system: HomeSystem }) {
  const { openSystemDetail } = useAppActions();
  const contacts = useContactMap();
  const nextDue = getNextDue(system);
  const days = daysUntil(nextDue);
  const provider = system.providerId ? contacts.get(system.providerId) : undefined;
  const subtitle = [system.brand, system.model].filter(Boolean).join(" · ");

  return (
    <motion.div {...itemMotion}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => openSystemDetail(system.id)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openSystemDetail(system.id);
          }
        }}
        className="group flex h-full cursor-pointer flex-col rounded-xl border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start gap-3">
          <CategoryIcon category={system.category} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-medium leading-snug">{system.name}</div>
            <div className="truncate text-[13px] text-muted-foreground">{subtitle || CATEGORY_META[system.category].label}</div>
          </div>
          <SystemActionsMenu system={system} className="-mr-1.5 -mt-1 opacity-60 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="mt-4 space-y-1.5 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className={cn("truncate", !system.location && "text-muted-foreground/50")}>
              {system.location || "No location"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <span className={cn("truncate", !nextDue && "text-muted-foreground/50")}>
              {nextDue ? `Next ${formatDate(nextDue, "MMM d")}` : "Not scheduled"}
              {system.intervalValue ? (
                <span className="text-muted-foreground/60"> · {formatInterval(system.intervalValue, system.intervalUnit).toLowerCase()}</span>
              ) : null}
            </span>
          </div>
          {provider && (
            <div className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{provider.company || provider.name}</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          <StatusBadge status={system.status} />
          <DueBadge days={days} />
          <span className="ml-auto">
            <MissingIndicator system={system} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function SystemRow({ system }: { system: HomeSystem }) {
  const { openSystemDetail } = useAppActions();
  const nextDue = getNextDue(system);
  const days = daysUntil(nextDue);

  return (
    <motion.li {...itemMotion} className="list-none">
      <div
        role="button"
        tabIndex={0}
        onClick={() => openSystemDetail(system.id)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openSystemDetail(system.id);
          }
        }}
        className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none"
      >
        <CategoryIcon category={system.category} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{system.name}</span>
            <MissingIndicator system={system} />
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {[CATEGORY_META[system.category].label, system.location].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="hidden w-28 text-right text-[13px] text-muted-foreground md:block">
          {nextDue ? formatDate(nextDue, "MMM d, yyyy") : "—"}
        </div>
        <div className="hidden w-24 justify-end sm:flex">
          <DueBadge days={days} />
        </div>
        <div className="hidden w-36 justify-end sm:flex">
          <StatusBadge status={system.status} />
        </div>
        <span className={cn("h-2 w-2 shrink-0 rounded-full sm:hidden", {
          "bg-sage-500": system.status === "good",
          "bg-amber-500": system.status === "attention",
          "bg-rose-500": system.status === "critical",
        })} />
        <SystemActionsMenu system={system} />
      </div>
    </motion.li>
  );
}
