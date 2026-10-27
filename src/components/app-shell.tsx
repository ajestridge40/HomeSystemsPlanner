"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, FileText, LayoutGrid, Plus, Settings, Users, Warehouse } from "lucide-react";
import { useAppActions } from "@/components/app-actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { daysUntil, getNextDue } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", short: "Home", icon: LayoutGrid, key: "1" },
  { href: "/systems", label: "Systems", short: "Systems", icon: Warehouse, key: "2" },
  { href: "/maintenance", label: "Maintenance", short: "Schedule", icon: CalendarDays, key: "3" },
  { href: "/contacts", label: "Contacts", short: "Contacts", icon: Users, key: "4" },
  { href: "/report", label: "Handoff Report", short: "Report", icon: FileText, key: "5" },
] as const;

export { NAV };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useStore();
  const { openSystemForm } = useAppActions();

  const dueSoon = data.systems.filter((s) => {
    const d = daysUntil(getNextDue(s));
    return d !== null && d <= 7;
  }).length;

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="print-hidden fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-surface/70 backdrop-blur lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo />
          </Link>
        </div>

        <div className="px-3 pb-3">
          <Button className="w-full justify-between" onClick={() => openSystemForm()}>
            <span className="flex items-center gap-2">
              <Plus />
              Add system
            </span>
            <Kbd className="border-white/20 bg-white/15 text-primary-foreground">N</Kbd>
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "text-foreground" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-md border bg-card shadow-soft"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <item.icon className={cn("relative h-4 w-4", active ? "text-sage-600" : "")} strokeWidth={1.9} />
                <span className="relative flex-1">{item.label}</span>
                {item.href === "/maintenance" && dueSoon > 0 && (
                  <span className="tabular relative rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">
                    {dueSoon}
                  </span>
                )}
                <span className="relative hidden text-[11px] text-muted-foreground/60 group-hover:inline">{item.key}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-3 py-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              isActive(pathname, "/settings")
                ? "bg-card text-foreground shadow-soft ring-1 ring-border"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <Settings className="h-4 w-4" strokeWidth={1.9} />
            Settings
          </Link>
          <div className="mt-3 truncate px-2.5 text-xs text-muted-foreground">
            {data.settings.homeName || "Your home"}
            <span className="block text-[11px] text-muted-foreground/70">Saved privately in this browser</span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="print-hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md lg:hidden">
        <Link href="/">
          <Logo compact />
        </Link>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href="/settings" aria-label="Settings">
                  <Settings />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <Button size="icon-sm" onClick={() => openSystemForm()} aria-label="Add system">
            <Plus />
          </Button>
        </div>
      </header>

      <main className="print-reset lg:pl-60">
        <div className="print-reset mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="print-hidden fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-sage-700" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-sage-600"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative">
                  <item.icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
                  {item.href === "/maintenance" && dueSoon > 0 && (
                    <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />
                  )}
                </span>
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
