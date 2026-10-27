"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, LayoutGrid, List, Plus, Search, SearchX, Sparkles, Warehouse, X } from "lucide-react";
import { useAppActions } from "@/components/app-actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { SystemCard, SystemRow } from "@/components/systems/system-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import { getMissingInfo, getNextDue } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { SYSTEM_CATEGORIES, SYSTEM_STATUSES, type HomeSystem, type SystemCategory, type SystemStatus } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

type SortKey = "due" | "name" | "updated" | "status";
const STATUS_ORDER: Record<SystemStatus, number> = { critical: 0, attention: 1, good: 2 };
const VIEW_KEY = "home-continuity:systems-view";

function sortSystems(list: HomeSystem[], sort: SortKey) {
  const copy = [...list];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "updated":
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "status":
      return copy.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name));
    case "due":
      return copy.sort((a, b) => {
        const da = getNextDue(a) ?? "9999";
        const db = getNextDue(b) ?? "9999";
        return da.localeCompare(db) || a.name.localeCompare(b.name);
      });
  }
}

function SystemsView() {
  const { data, hydrated, loadSample } = useStore();
  const { openSystemForm } = useAppActions();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SystemCategory | "all">("all");
  const [status, setStatus] = useState<SystemStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("due");
  const [view, setView] = useState<"grid" | "list">("grid");
  const missingOnly = params.get("filter") === "missing";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const changeView = (v: "grid" | "list") => {
    setView(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const setMissingOnly = (on: boolean) => {
    router.replace(on ? `${pathname}?filter=missing` : pathname, { scroll: false });
  };

  // "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(t.tagName) || t.isContentEditable) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const map = new Map<SystemCategory, number>();
    data.systems.forEach((s) => map.set(s.category, (map.get(s.category) ?? 0) + 1));
    return map;
  }, [data.systems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.systems.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (status !== "all" && s.status !== status) return false;
      if (missingOnly && getMissingInfo(s).length === 0) return false;
      if (!q) return true;
      return [s.name, s.location, s.brand, s.model, s.serialNumber, s.notes, CATEGORY_META[s.category].label]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return sortSystems(list, sort);
  }, [data.systems, query, category, status, missingOnly, sort]);

  if (!hydrated) return <PageSkeleton cards={0} />;

  const hasFilters = query || category !== "all" || status !== "all" || missingOnly;
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
    if (missingOnly) setMissingOnly(false);
  };

  const presentCategories = SYSTEM_CATEGORIES.filter((c) => counts.has(c));

  return (
    <div>
      <PageHeader
        title="Systems"
        description={
          data.systems.length
            ? `${pluralize(data.systems.length, "item")} across your home`
            : "Everything that keeps your home running."
        }
        actions={
          <Button onClick={() => openSystemForm({ defaults: category !== "all" ? { category } : undefined })}>
            <Plus />
            Add system
          </Button>
        }
      />

      {data.systems.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="Your inventory is empty"
          description="Add appliances, HVAC equipment, warranties, utilities — anything someone would need to know about if you weren’t around."
        >
          <Button onClick={() => openSystemForm()}>
            <Plus />
            Add a system
          </Button>
          <Button variant="outline" onClick={() => loadSample()}>
            <Sparkles />
            Load a sample home
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
                placeholder="Search by name, location, brand, model, serial…"
                className="pl-9 pr-10"
                aria-label="Search systems"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex">/</Kbd>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as SystemStatus | "all")}>
                <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {SYSTEM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-full sm:w-[150px]" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due">Next due</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden rounded-md border bg-card p-0.5 shadow-soft sm:flex">
                {(["grid", "list"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => changeView(v)}
                    aria-label={`${v} view`}
                    aria-pressed={view === v}
                    className={cn(
                      "flex h-7 w-8 items-center justify-center rounded transition-colors",
                      view === v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <Chip active={category === "all" && !missingOnly} onClick={() => (setCategory("all"), missingOnly && setMissingOnly(false))}>
              All <span className="tabular text-muted-foreground">{data.systems.length}</span>
            </Chip>
            {presentCategories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? "all" : c)}>
                {CATEGORY_META[c].short}
                <span className="tabular text-muted-foreground">{counts.get(c)}</span>
              </Chip>
            ))}
            <Chip active={missingOnly} onClick={() => setMissingOnly(!missingOnly)} tone="warn">
              <AlertCircle className="h-3.5 w-3.5" />
              Missing info
            </Chip>
          </div>

          <div className="mt-5">
            {filtered.length === 0 ? (
              <EmptyState
                compact
                icon={SearchX}
                title="No matching systems"
                description={missingOnly && !query && category === "all" && status === "all" ? "Every system has its key details filled in. 🎉" : "Try a different search or clear your filters."}
              >
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </EmptyState>
            ) : view === "grid" ? (
              <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {filtered.map((s) => (
                    <SystemCard key={s.id} system={s} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <Card className="overflow-hidden">
                <div className="hidden items-center gap-3 border-b bg-surface/60 px-4 py-2 text-xs font-medium text-muted-foreground sm:flex">
                  <span className="w-7" />
                  <span className="flex-1">Name</span>
                  <span className="hidden w-28 text-right md:block">Next due</span>
                  <span className="w-24" />
                  <span className="w-36 text-right">Status</span>
                  <span className="w-8" />
                </div>
                <ul className="divide-y">
                  <AnimatePresence initial={false}>
                    {filtered.map((s) => (
                      <SystemRow key={s.id} system={s} />
                    ))}
                  </AnimatePresence>
                </ul>
              </Card>
            )}
            {hasFilters && filtered.length > 0 && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Showing {filtered.length} of {data.systems.length} ·{" "}
                <button onClick={clearFilters} className="font-medium text-primary hover:underline">
                  Clear filters
                </button>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? tone === "warn"
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-stone-800 bg-stone-800 text-stone-50 [&_.text-muted-foreground]:text-stone-400"
          : "bg-card text-foreground/80 hover:border-stone-300 hover:bg-muted/50",
      )}
    >
      {children}
    </button>
  );
}

export default function SystemsPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <SystemsView />
    </Suspense>
  );
}
