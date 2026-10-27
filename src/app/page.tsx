"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  HousePlus,
  type LucideIcon,
  Phone,
  Plus,
  Siren,
  Sparkles,
  UserPlus,
  Warehouse,
} from "lucide-react";
import { useAppActions } from "@/components/app-actions";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { DueBadge, StatusBadge } from "@/components/status-badge";
import { SystemCard } from "@/components/systems/system-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_META, CONTACT_CATEGORY_META } from "@/lib/constants";
import { buildEvents, formatDate, formatRelative, getMissingInfo } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { SystemCategory } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = "default",
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  href?: string;
  tone?: "default" | "warn" | "alert";
  index: number;
}) {
  const content = (
    <Card
      className={cn(
        "group h-full p-4 transition-all duration-200 sm:p-5",
        href && "hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lift",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            tone === "default" && "bg-sage-50 text-sage-600",
            tone === "warn" && "bg-amber-50 text-amber-600",
            tone === "alert" && "bg-rose-50 text-rose-600",
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
      <div className="tabular mt-3 text-[28px] font-semibold leading-none tracking-tight">{value}</div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        {hint}
        {href && <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />}
      </div>
    </Card>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
    >
      {href ? (
        <Link href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}

const QUICK_START: SystemCategory[] = ["hvac", "plumbing", "electrical", "appliances", "filters", "warranties"];

function QuickAddMenu() {
  const { openSystemForm, openContactForm } = useAppActions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus />
          Quick add
          <ChevronDown className="-mr-1 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => openSystemForm()}>
          <Warehouse />
          System
          <DropdownMenuShortcut>N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openContactForm()}>
          <UserPlus />
          Contact
          <DropdownMenuShortcut>C</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WelcomeEmpty() {
  const { openSystemForm } = useAppActions();
  const { loadSample } = useStore();
  return (
    <div className="space-y-6">
      <EmptyState
        icon={HousePlus}
        title="Let’s map out your home"
        description="Start with the systems you’d least want to scramble for in an emergency — the furnace, water heater, and electrical panel are great first picks."
      >
        <Button onClick={() => openSystemForm()}>
          <Plus />
          Add your first system
        </Button>
        <Button variant="outline" onClick={() => loadSample()}>
          <Sparkles />
          Load a sample home
        </Button>
      </EmptyState>
      <div>
        <p className="mb-3 text-[13px] font-medium text-muted-foreground">Or start with a category</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_START.map((c, i) => (
            <motion.button
              key={c}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              onClick={() => openSystemForm({ defaults: { category: c } })}
              className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-left text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CategoryIcon category={c} size="sm" />
              <span className="truncate">{CATEGORY_META[c].short}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, hydrated } = useStore();
  const { openMarkComplete, openSystemDetail, openContactForm } = useAppActions();

  const stats = useMemo(() => {
    const events = buildEvents(data.systems);
    const upcoming = events.filter((e) => e.days <= 30);
    const overdue = events.filter((e) => e.days < 0).length;
    const missing = data.systems.filter((s) => getMissingInfo(s).length > 0);
    const categories = new Set(data.systems.map((s) => s.category)).size;
    const attention = data.systems
      .filter((s) => s.status !== "good")
      .sort((a, b) => (a.status === b.status ? 0 : a.status === "critical" ? -1 : 1));
    return { upcoming, overdue, missing, categories, attention };
  }, [data.systems]);

  const emergency = useMemo(
    () => [...data.contacts].sort((a, b) => Number(b.isEmergency) - Number(a.isEmergency)).slice(0, 4),
    [data.contacts],
  );

  if (!hydrated) return <PageSkeleton />;

  const { settings, systems } = data;
  const recentSystems = [...systems].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <div>
      <PageHeader
        title={settings.homeName ? `${greeting()} — ${settings.homeName}` : greeting()}
        description={
          systems.length === 0
            ? "Here’s where your home’s essential knowledge will live."
            : stats.overdue > 0
              ? `${pluralize(stats.overdue, "task")} overdue. Let’s get ahead of it.`
              : stats.upcoming.length > 0
                ? "A few things are coming up soon. Everything else is on track."
                : "Everything is on track. Nice work."
        }
        actions={
          <>
            {systems.length > 0 && (
              <Button variant="outline" asChild>
                <Link href="/report">
                  <FileText />
                  Handoff report
                </Link>
              </Button>
            )}
            <QuickAddMenu />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          index={0}
          icon={Warehouse}
          label="Systems tracked"
          value={systems.length}
          hint={systems.length ? `Across ${pluralize(stats.categories, "category", "categories")}` : "Add your first one"}
          href="/systems"
        />
        <StatCard
          index={1}
          icon={CalendarClock}
          label="Due in 30 days"
          value={stats.upcoming.length}
          hint={stats.overdue > 0 ? <span className="font-medium text-rose-600">{stats.overdue} overdue</span> : "Nothing overdue"}
          tone={stats.overdue > 0 ? "alert" : stats.upcoming.length ? "warn" : "default"}
          href="/maintenance"
        />
        <StatCard
          index={2}
          icon={AlertCircle}
          label="Missing info"
          value={stats.missing.length}
          hint={stats.missing.length ? "Systems with gaps" : "All details complete"}
          tone={stats.missing.length ? "warn" : "default"}
          href="/systems?filter=missing"
        />
        <StatCard
          index={3}
          icon={Clock}
          label="Last updated"
          value={<span className="text-xl sm:text-2xl">{data.updatedAt ? formatRelative(data.updatedAt) : "—"}</span>}
          hint={data.updatedAt ? formatDate(data.updatedAt.slice(0, 10)) : "No changes yet"}
        />
      </div>

      {systems.length === 0 ? (
        <div className="mt-8">
          <WelcomeEmpty />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">Coming up</h2>
                  <p className="text-[13px] text-muted-foreground">Overdue and next 30 days</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/maintenance">
                    Calendar
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
              {stats.upcoming.length === 0 ? (
                <div className="flex flex-col items-center px-5 pb-8 pt-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium">You’re all caught up</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">Nothing is due in the next 30 days.</p>
                </div>
              ) : (
                <ul className="divide-y px-2 pb-2">
                  <AnimatePresence initial={false}>
                    {stats.upcoming.slice(0, 6).map((e) => (
                      <motion.li
                        key={e.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <button
                          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                          onClick={() => openSystemDetail(e.system.id)}
                        >
                          <CategoryIcon category={e.system.category} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{e.system.name}</span>
                            <span className="block text-xs text-muted-foreground">{formatDate(e.date, "EEE, MMM d")}</span>
                          </span>
                        </button>
                        <DueBadge days={e.days} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="hidden sm:inline-flex"
                          onClick={() => openMarkComplete(e.system.id)}
                        >
                          <CheckCircle2 />
                          Done
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="sm:hidden"
                          onClick={() => openMarkComplete(e.system.id)}
                          aria-label={`Mark ${e.system.name} complete`}
                        >
                          <CheckCircle2 />
                        </Button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {stats.upcoming.length > 6 && (
                    <li className="px-3 pt-3 text-center">
                      <Link href="/maintenance" className="text-[13px] font-medium text-primary hover:underline">
                        View {stats.upcoming.length - 6} more
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </Card>

            <div className="space-y-6 lg:col-span-2">
              {stats.attention.length > 0 && (
                <Card>
                  <div className="px-5 pb-2 pt-5">
                    <h2 className="text-[15px] font-semibold tracking-tight">Needs attention</h2>
                    <p className="text-[13px] text-muted-foreground">Flagged by status</p>
                  </div>
                  <ul className="px-2 pb-2">
                    {stats.attention.slice(0, 4).map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => openSystemDetail(s.id)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                          <StatusBadge status={s.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card>
                <div className="flex items-center justify-between px-5 pb-2 pt-5">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-tight">Key contacts</h2>
                    <p className="text-[13px] text-muted-foreground">Who to call</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/contacts">
                      All
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
                {emergency.length === 0 ? (
                  <div className="px-5 pb-5 pt-2">
                    <p className="text-[13px] text-muted-foreground">
                      Add your plumber, electrician and utility companies so they’re one tap away.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => openContactForm()}>
                      <UserPlus />
                      Add contact
                    </Button>
                  </div>
                ) : (
                  <ul className="px-2 pb-2">
                    {emergency.map((c) => (
                      <li key={c.id} className="flex items-center gap-3 rounded-lg px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {c.isEmergency && <Siren className="h-3.5 w-3.5 shrink-0 text-rose-500" />}
                            <span className="truncate">{c.name}</span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {c.company || CONTACT_CATEGORY_META[c.category].label}
                          </div>
                        </div>
                        {c.phone && (
                          <Button size="sm" variant="ghost" asChild className="tabular shrink-0 text-foreground">
                            <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>
                              <Phone className="text-sage-600" />
                              <span className="hidden sm:inline">{c.phone}</span>
                            </a>
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Recently updated</h2>
                <p className="text-[13px] text-muted-foreground">{pluralize(systems.length, "system")} in your inventory</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/systems">
                  View all
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {recentSystems.map((s) => (
                  <SystemCard key={s.id} system={s} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
