"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAppActions } from "@/components/app-actions";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { DueBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORY_META, STATUS_META } from "@/lib/constants";
import { buildEvents, formatDate, formatInterval, parseDate, type MaintenanceEvent } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { SYSTEM_CATEGORIES, SYSTEM_STATUSES, type SystemCategory, type SystemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const GROUPS: { key: string; label: string; test: (days: number) => boolean }[] = [
  { key: "overdue", label: "Overdue", test: (d) => d < 0 },
  { key: "week", label: "This week", test: (d) => d >= 0 && d <= 7 },
  { key: "month", label: "Next 30 days", test: (d) => d > 7 && d <= 30 },
  { key: "quarter", label: "Next 3 months", test: (d) => d > 30 && d <= 90 },
  { key: "later", label: "Later", test: (d) => d > 90 },
];

function EventRow({ event }: { event: MaintenanceEvent }) {
  const { openMarkComplete, openSystemDetail } = useAppActions();
  const { system, kind } = event;
  const warranty = kind === "warranty";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="hidden w-14 shrink-0 text-center sm:block">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{formatDate(event.date, "MMM")}</div>
        <div className="tabular text-xl font-semibold leading-tight">{formatDate(event.date, "d")}</div>
      </div>
      <button
        onClick={() => openSystemDetail(system.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
      >
        <CategoryIcon category={system.category} size="sm" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{system.name}</span>
            {warranty && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-1.5 py-px text-[11px] font-medium text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                Warranty ends
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            <span className="sm:hidden">{formatDate(event.date, "EEE, MMM d")} · </span>
            {warranty
              ? "Review coverage or consider an extension"
              : [formatInterval(system.intervalValue, system.intervalUnit), system.location].filter((v) => v && v !== "—").join(" · ") ||
                "One-time task"}
          </span>
        </span>
      </button>
      <div className="hidden md:block">
        <StatusBadge status={system.status} />
      </div>
      <DueBadge days={event.days} />
      {!warranty ? (
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => openMarkComplete(system.id)}
          aria-label={`Mark ${system.name} complete`}
          className="shrink-0 hover:border-sage-200 hover:bg-sage-50 hover:text-sage-700"
        >
          <CheckCircle2 />
        </Button>
      ) : (
        <span className="w-8 shrink-0" />
      )}
    </motion.li>
  );
}

function Timeline({ events }: { events: MaintenanceEvent[] }) {
  const groups = GROUPS.map((g) => ({ ...g, items: events.filter((e) => g.test(e.days)) })).filter((g) => g.items.length);
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <h2 className={cn("text-[13px] font-semibold", g.key === "overdue" ? "text-rose-600" : "text-foreground")}>{g.label}</h2>
            <span className="tabular rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">{g.items.length}</span>
          </div>
          <Card className={cn("overflow-hidden", g.key === "overdue" && "border-rose-200")}>
            <ul className="divide-y">
              <AnimatePresence initial={false}>
                {g.items.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </AnimatePresence>
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

function MonthCalendar({ events }: { events: MaintenanceEvent[] }) {
  const { openSystemDetail } = useAppActions();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(() => new Date());

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const byDay = useMemo(() => {
    const map = new Map<string, MaintenanceEvent[]>();
    events.forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return map;
  }, [events]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedEvents = byDay.get(selectedKey) ?? [];
  const monthCount = events.filter((e) => {
    const d = parseDate(e.date);
    return d && isSameMonth(d, month);
  }).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{format(month, "MMMM yyyy")}</h2>
            <p className="text-xs text-muted-foreground">{monthCount ? `${monthCount} scheduled` : "Nothing scheduled"}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMonth(startOfMonth(new Date()));
                setSelected(new Date());
              }}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Previous month">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b bg-surface/50 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={month.toISOString()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-7"
          >
            {days.map((day, i) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = byDay.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const isSelected = isSameDay(day, selected);
              return (
                <button
                  key={key}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "relative flex min-h-[56px] flex-col items-stretch gap-1 border-b border-r p-1.5 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-[92px]",
                    (i + 1) % 7 === 0 && "border-r-0",
                    !inMonth && "bg-surface/40 text-muted-foreground/50",
                    isSelected ? "bg-sage-50/80" : "hover:bg-muted/40",
                  )}
                  aria-label={`${format(day, "MMMM d")}${dayEvents.length ? `, ${dayEvents.length} items` : ""}`}
                >
                  <span
                    className={cn(
                      "tabular flex h-6 w-6 items-center justify-center self-center rounded-full text-xs font-medium sm:self-start",
                      isToday(day) && "bg-sage-600 text-white",
                      isSelected && !isToday(day) && "ring-1 ring-sage-500",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {/* Compact dots on mobile, labels on larger screens */}
                  <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_META[e.system.category].dot }} />
                    ))}
                  </span>
                  <span className="hidden space-y-0.5 sm:block">
                    {dayEvents.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] font-medium",
                          e.days < 0 && e.kind === "maintenance" ? "bg-rose-50 text-rose-700" : "bg-muted text-foreground/80",
                        )}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CATEGORY_META[e.system.category].dot }} />
                        <span className="truncate">{e.system.name}</span>
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="block px-1 text-[11px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                    )}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </Card>

      <Card className="h-fit lg:sticky lg:top-10">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{format(selected, "EEEE")}</h3>
          <p className="text-xs text-muted-foreground">{format(selected, "MMMM d, yyyy")}</p>
        </div>
        {selectedEvents.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">Nothing scheduled for this day.</p>
        ) : (
          <ul className="divide-y">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => openSystemDetail(e.system.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <CategoryIcon category={e.system.category} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.system.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {e.kind === "warranty" ? "Warranty expires" : "Maintenance due"}
                    </span>
                  </span>
                  <DueBadge days={e.days} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function MaintenancePage() {
  const { data, hydrated, loadSample } = useStore();
  const { openSystemForm } = useAppActions();
  const [category, setCategory] = useState<SystemCategory | "all">("all");
  const [status, setStatus] = useState<SystemStatus | "all">("all");
  const [showWarranties, setShowWarranties] = useState(true);

  const allEvents = useMemo(() => buildEvents(data.systems, { includeWarranties: true }), [data.systems]);
  const events = useMemo(
    () =>
      allEvents.filter(
        (e) =>
          (showWarranties || e.kind !== "warranty") &&
          (category === "all" || e.system.category === category) &&
          (status === "all" || e.system.status === status),
      ),
    [allEvents, category, status, showWarranties],
  );

  if (!hydrated) return <PageSkeleton cards={0} />;

  const overdue = allEvents.filter((e) => e.kind === "maintenance" && e.days < 0).length;
  const unscheduled = data.systems.filter((s) => !allEvents.some((e) => e.system.id === s.id && e.kind === "maintenance")).length;
  const filtersActive = category !== "all" || status !== "all" || !showWarranties;

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description={
          overdue > 0
            ? `${overdue} overdue · ${allEvents.filter((e) => e.kind === "maintenance").length} scheduled in total`
            : "Upcoming service, filter changes and warranty dates."
        }
      />

      {data.systems.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No maintenance scheduled yet"
          description="Add a system with a service interval — like a furnace filter every 3 months — and it will show up here automatically."
        >
          <Button onClick={() => openSystemForm({ defaults: { category: "filters", intervalValue: 3, intervalUnit: "months" } })}>
            <Plus />
            Add a recurring task
          </Button>
          <Button variant="outline" onClick={() => loadSample()}>
            <Sparkles />
            Load a sample home
          </Button>
        </EmptyState>
      ) : (
        <Tabs defaultValue="timeline">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="self-start">
              <TabsTrigger value="timeline">
                <ListTodo />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarRange />
                Calendar
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              <Select value={category} onValueChange={(v) => setCategory(v as SystemCategory | "all")}>
                <SelectTrigger className="h-8 w-[170px] text-[13px]" aria-label="Filter by category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {SYSTEM_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v as SystemStatus | "all")}>
                <SelectTrigger className="h-8 w-[150px] text-[13px]" aria-label="Filter by status">
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
              <Button
                variant="outline"
                size="sm"
                aria-pressed={showWarranties}
                onClick={() => setShowWarranties((v) => !v)}
                className={cn(showWarranties && "border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-50")}
              >
                <ShieldCheck />
                Warranties
              </Button>
            </div>
          </div>

          <TabsContent value="timeline">
            {events.length === 0 ? (
              <EmptyState
                compact
                icon={CheckCircle2}
                title={filtersActive ? "Nothing matches these filters" : "Nothing on the schedule"}
                description={
                  filtersActive
                    ? "Try another category or status."
                    : "Add a service interval to any system and its next due date will appear here."
                }
              >
                {filtersActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCategory("all");
                      setStatus("all");
                      setShowWarranties(true);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </EmptyState>
            ) : (
              <Timeline events={events} />
            )}
            {unscheduled > 0 && !filtersActive && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {unscheduled} {unscheduled === 1 ? "system has" : "systems have"} no maintenance schedule. Add an interval to track{" "}
                {unscheduled === 1 ? "it" : "them"}.
              </p>
            )}
          </TabsContent>
          <TabsContent value="calendar">
            <MonthCalendar events={events} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
