"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Check, FileText, Plus, Printer, Settings2 } from "lucide-react";
import { useAppActions } from "@/components/app-actions";
import { EmptyState } from "@/components/empty-state";
import { LogoMark } from "@/components/logo";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_META, CONTACT_CATEGORY_META, STATUS_META } from "@/lib/constants";
import { buildEvents, describeDue, formatDate, formatInterval, getNextDue } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { SYSTEM_CATEGORIES, type Contact, type HomeSystem } from "@/lib/types";
import { cn } from "@/lib/utils";

type SectionKey = "notes" | "emergency" | "maintenance" | "systems" | "contacts";
const SECTION_LABELS: Record<SectionKey, string> = {
  notes: "Household notes",
  emergency: "Emergency contacts",
  maintenance: "Upcoming maintenance",
  systems: "Systems inventory",
  contacts: "All contacts",
};

function SectionTitle({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-baseline gap-3 border-b border-stone-200 pb-2 text-[15px] font-semibold tracking-tight text-stone-900">
      <span className="tabular text-xs font-medium text-stone-400">{String(index).padStart(2, "0")}</span>
      {children}
    </h2>
  );
}

function StatusDot({ status }: { status: HomeSystem["status"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[status].dot)} />
      {STATUS_META[status].label}
    </span>
  );
}

function SystemBlock({ system, provider }: { system: HomeSystem; provider?: Contact }) {
  const nextDue = getNextDue(system);
  const rows: [string, string | undefined][] = [
    ["Location", system.location],
    ["Brand / model", [system.brand, system.model].filter(Boolean).join(" · ")],
    ["Serial no.", system.serialNumber],
    ["Installed", system.installDate ? formatDate(system.installDate) : undefined],
    ["Warranty until", system.warrantyExpiration ? formatDate(system.warrantyExpiration) : undefined],
    ["Service interval", system.intervalValue ? formatInterval(system.intervalValue, system.intervalUnit) : undefined],
    ["Last serviced", system.lastServiced ? formatDate(system.lastServiced) : undefined],
    ["Next due", nextDue ? formatDate(nextDue) : undefined],
    ["Provider", provider ? [provider.name, provider.phone].filter(Boolean).join(" · ") : undefined],
    ["Manual / docs", system.manualUrl],
  ];
  const filled = rows.filter(([, v]) => v);

  return (
    <div className="print-avoid-break rounded-lg border border-stone-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <h4 className="text-sm font-semibold text-stone-900">{system.name}</h4>
        <StatusDot status={system.status} />
      </div>
      {filled.length > 0 && (
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 print:grid-cols-2">
          {filled.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-28 shrink-0 text-stone-500">{label}</dt>
              <dd className="min-w-0 break-words text-stone-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {system.notes && (
        <p className="mt-3 whitespace-pre-wrap border-t border-dashed border-stone-200 pt-3 text-[13px] leading-relaxed text-stone-700">
          {system.notes}
        </p>
      )}
    </div>
  );
}

function ContactTable({ contacts }: { contacts: Contact[] }) {
  return (
    <table className="w-full text-left text-[13px]">
      <thead>
        <tr className="text-xs text-stone-500">
          <th className="pb-2 pr-4 font-medium">Name</th>
          <th className="pb-2 pr-4 font-medium">Role</th>
          <th className="pb-2 pr-4 font-medium">Phone</th>
          <th className="hidden pb-2 font-medium sm:table-cell print:table-cell">Email</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {contacts.map((c) => (
          <tr key={c.id} className="print-avoid-break align-top">
            <td className="py-2 pr-4">
              <div className="font-medium text-stone-900">{c.name}</div>
              {c.company && <div className="text-stone-500">{c.company}</div>}
              {c.notes && <div className="mt-0.5 text-xs text-stone-500">{c.notes}</div>}
            </td>
            <td className="py-2 pr-4 text-stone-700">{CONTACT_CATEGORY_META[c.category].label}</td>
            <td className="tabular whitespace-nowrap py-2 pr-4 font-medium text-stone-900">{c.phone || "—"}</td>
            <td className="hidden whitespace-nowrap py-2 text-stone-700 sm:table-cell print:table-cell">{c.email || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportPage() {
  const { data, hydrated } = useStore();
  const { openSystemForm } = useAppActions();
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    notes: true,
    emergency: true,
    maintenance: true,
    systems: true,
    contacts: true,
  });

  const contactMap = useMemo(() => new Map(data.contacts.map((c) => [c.id, c])), [data.contacts]);
  const upcoming = useMemo(
    () => buildEvents(data.systems, { includeWarranties: true }).filter((e) => e.days <= 90),
    [data.systems],
  );
  const grouped = useMemo(
    () =>
      SYSTEM_CATEGORIES.map((c) => ({
        category: c,
        systems: data.systems.filter((s) => s.category === c).sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((g) => g.systems.length),
    [data.systems],
  );

  if (!hydrated) return <PageSkeleton cards={0} />;

  const { settings } = data;
  const emergency = data.contacts.filter((c) => c.isEmergency).sort((a, b) => a.name.localeCompare(b.name));
  const allContacts = [...data.contacts].sort((a, b) => a.name.localeCompare(b.name));
  const needsAttention = data.systems.filter((s) => s.status !== "good").length;
  const generated = new Date();

  const visible = (Object.keys(sections) as SectionKey[]).filter((k) => {
    if (!sections[k]) return false;
    if (k === "notes") return Boolean(settings.generalNotes.trim());
    if (k === "emergency") return emergency.length > 0;
    if (k === "contacts") return allContacts.length > 0;
    if (k === "systems") return data.systems.length > 0;
    return true;
  });
  const indexOf = (k: SectionKey) => visible.indexOf(k) + 1;

  const isEmpty = data.systems.length === 0 && data.contacts.length === 0;

  return (
    <div>
      <div className="print-hidden">
        <PageHeader
          title="Handoff Report"
          description="A clean summary of your home for house-sitters, buyers, family, or your future self."
          actions={
            !isEmpty && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Settings2 />
                      Sections
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Include in report</DropdownMenuLabel>
                    {(Object.keys(SECTION_LABELS) as SectionKey[]).map((k) => (
                      <DropdownMenuItem
                        key={k}
                        onSelect={(e) => {
                          e.preventDefault();
                          setSections((s) => ({ ...s, [k]: !s[k] }));
                        }}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            sections[k] ? "border-sage-600 bg-sage-600 text-white" : "border-input",
                          )}
                        >
                          {sections[k] && <Check className="!h-3 !w-3 !text-white" strokeWidth={3} />}
                        </span>
                        {SECTION_LABELS[k]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => window.print()}>
                  <Printer />
                  Print or save PDF
                </Button>
              </>
            )
          }
        />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FileText}
          title="Nothing to hand off yet"
          description="Your report builds itself from your systems, maintenance schedule and contacts. Add a few to see it come together."
        >
          <Button onClick={() => openSystemForm()}>
            <Plus />
            Add a system
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contacts">Add contacts</Link>
          </Button>
        </EmptyState>
      ) : (
        <article className="print-reset mx-auto max-w-[8.5in] rounded-xl border bg-white px-6 py-8 text-stone-800 shadow-lift sm:px-12 sm:py-12">
          {/* Cover */}
          <header className="border-b border-stone-200 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                <LogoMark className="h-5 w-5" />
                Home Handoff Report
              </div>
              <div className="text-right text-xs text-stone-500">Generated {format(generated, "MMMM d, yyyy")}</div>
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-900">{settings.homeName || "Our Home"}</h1>
            {settings.address && <p className="mt-1 text-[15px] text-stone-600">{settings.address}</p>}
            {settings.ownerName && <p className="mt-3 text-[13px] text-stone-500">Prepared by {settings.ownerName}</p>}

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200 sm:grid-cols-4 print:grid-cols-4">
              {[
                ["Systems", data.systems.length],
                ["Due in 90 days", upcoming.filter((e) => e.kind === "maintenance").length],
                ["Need attention", needsAttention],
                ["Contacts", data.contacts.length],
              ].map(([label, value]) => (
                <div key={label} className="bg-white px-4 py-3">
                  <dt className="text-xs text-stone-500">{label}</dt>
                  <dd className="tabular mt-0.5 text-xl font-semibold text-stone-900">{value}</dd>
                </div>
              ))}
            </dl>
          </header>

          <div className="mt-8 space-y-10">
            {visible.includes("notes") && (
              <section className="print-avoid-break">
                <SectionTitle index={indexOf("notes")}>Household notes</SectionTitle>
                <p className="whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-[13px] leading-relaxed text-stone-700 print:border print:border-stone-200">
                  {settings.generalNotes}
                </p>
              </section>
            )}

            {visible.includes("emergency") && (
              <section className="print-avoid-break">
                <SectionTitle index={indexOf("emergency")}>Emergency contacts</SectionTitle>
                <ContactTable contacts={emergency} />
              </section>
            )}

            {visible.includes("maintenance") && (
              <section>
                <SectionTitle index={indexOf("maintenance")}>Upcoming maintenance · next 90 days</SectionTitle>
                {upcoming.length === 0 ? (
                  <p className="text-[13px] text-stone-500">Nothing is due in the next 90 days.</p>
                ) : (
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="text-xs text-stone-500">
                        <th className="pb-2 pr-4 font-medium">Date</th>
                        <th className="pb-2 pr-4 font-medium">Task</th>
                        <th className="hidden pb-2 pr-4 font-medium sm:table-cell print:table-cell">Interval</th>
                        <th className="pb-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {upcoming.map((e) => (
                        <tr key={e.id} className="print-avoid-break align-top">
                          <td className="tabular whitespace-nowrap py-2 pr-4 text-stone-700">{formatDate(e.date, "MMM d, yyyy")}</td>
                          <td className="py-2 pr-4">
                            <span className="font-medium text-stone-900">{e.system.name}</span>
                            <span className="block text-xs text-stone-500">
                              {e.kind === "warranty" ? "Warranty expires" : CATEGORY_META[e.system.category].label}
                              {e.system.location ? ` · ${e.system.location}` : ""}
                            </span>
                          </td>
                          <td className="hidden py-2 pr-4 text-stone-600 sm:table-cell print:table-cell">
                            {e.kind === "warranty" ? "—" : formatInterval(e.system.intervalValue, e.system.intervalUnit)}
                          </td>
                          <td className={cn("whitespace-nowrap py-2", e.days < 0 ? "font-medium text-rose-700" : "text-stone-700")}>
                            {e.kind === "warranty" ? (e.days < 0 ? "Expired" : `In ${e.days} days`) : describeDue(e.days)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}

            {visible.includes("systems") && (
              <section className="print-break-before">
                <SectionTitle index={indexOf("systems")}>Systems inventory</SectionTitle>
                <div className="space-y-8">
                  {grouped.map((g) => (
                    <div key={g.category}>
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[g.category].dot }} />
                        {CATEGORY_META[g.category].label}
                        <span className="font-normal">({g.systems.length})</span>
                      </h3>
                      <div className="space-y-3">
                        {g.systems.map((s) => (
                          <SystemBlock key={s.id} system={s} provider={s.providerId ? contactMap.get(s.providerId) : undefined} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {visible.includes("contacts") && (
              <section className="print-avoid-break">
                <SectionTitle index={indexOf("contacts")}>All contacts</SectionTitle>
                <ContactTable contacts={allContacts} />
              </section>
            )}
          </div>

          <footer className="mt-12 flex items-center justify-between border-t border-stone-200 pt-4 text-[11px] text-stone-400">
            <span>Home Continuity · {settings.homeName || "Home"} handoff</span>
            <span>Information current as of {format(generated, "MMM d, yyyy")}</span>
          </footer>
        </article>
      )}
    </div>
  );
}
