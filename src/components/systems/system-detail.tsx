"use client";

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { DueBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CATEGORY_META, CONTACT_CATEGORY_META } from "@/lib/constants";
import { daysUntil, describeDue, formatDate, formatInterval, getMissingInfo, getNextDue } from "@/lib/domain";
import { useContactMap } from "@/lib/store";
import type { HomeSystem } from "@/lib/types";

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function DetailRow({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  const empty = value === undefined || value === null || value === "" || value === "—";
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={empty ? "text-muted-foreground/60" : mono ? "break-all font-mono text-[13px]" : "break-words"}>
        {empty ? "Not set" : value}
      </dd>
    </div>
  );
}

export function SystemDetailSheet({
  system,
  open,
  onOpenChange,
  onEdit,
  onComplete,
  onDelete,
}: {
  system: HomeSystem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (system: HomeSystem) => void;
  onComplete: (system: HomeSystem) => void;
  onDelete: (system: HomeSystem) => void;
}) {
  const contacts = useContactMap();
  if (!system) return null;

  const nextDue = getNextDue(system);
  const days = daysUntil(nextDue);
  const missing = getMissingInfo(system);
  const provider = system.providerId ? contacts.get(system.providerId) : undefined;
  const warrantyDays = daysUntil(system.warrantyExpiration);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <div className="flex h-full flex-col">
          <div className="border-b px-6 pb-5 pt-6">
            <div className="flex items-start gap-3.5 pr-8">
              <CategoryIcon category={system.category} size="lg" />
              <div className="min-w-0">
                <SheetTitle className="text-xl leading-snug">{system.name}</SheetTitle>
                <SheetDescription className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{CATEGORY_META[system.category].label}</span>
                  {system.location && (
                    <>
                      <span className="text-border">•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {system.location}
                      </span>
                    </>
                  )}
                </SheetDescription>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <StatusBadge status={system.status} />
                  <DueBadge days={days} />
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              {nextDue && (
                <Button size="sm" onClick={() => onComplete(system)}>
                  <CheckCircle2 />
                  Mark complete
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => onEdit(system)}>
                <Pencil />
                Edit
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="ml-auto hover:bg-rose-50 hover:text-destructive"
                onClick={() => onDelete(system)}
                aria-label="Delete system"
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {missing.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <AlertCircle className="h-4 w-4" />
                  Missing details
                </div>
                <p className="mt-1 text-sm text-amber-800/90">
                  Add {missing.map((m) => m.label.toLowerCase()).join(", ")} so anyone can take over with confidence.
                </p>
              </div>
            )}

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Maintenance</h3>
              <dl className="divide-y">
                <DetailRow label="Interval" value={formatInterval(system.intervalValue, system.intervalUnit)} />
                <DetailRow label="Last serviced" value={formatDate(system.lastServiced)} />
                <DetailRow
                  label="Next due"
                  value={
                    nextDue ? (
                      <span>
                        {formatDate(nextDue)}
                        <span className="ml-1.5 text-muted-foreground">· {describeDue(days)}</span>
                      </span>
                    ) : undefined
                  }
                />
              </dl>
            </section>

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
              <dl className="divide-y">
                <DetailRow label="Brand" value={system.brand} />
                <DetailRow label="Model" value={system.model} mono />
                <DetailRow label="Serial number" value={system.serialNumber} mono />
                <DetailRow label="Installed" value={formatDate(system.installDate)} />
                <DetailRow
                  label="Warranty"
                  value={
                    system.warrantyExpiration ? (
                      <span>
                        {formatDate(system.warrantyExpiration)}
                        {warrantyDays !== null && (
                          <span className={warrantyDays < 0 ? "ml-1.5 text-rose-600" : "ml-1.5 text-muted-foreground"}>
                            · {warrantyDays < 0 ? "Expired" : `${warrantyDays} days left`}
                          </span>
                        )}
                      </span>
                    ) : undefined
                  }
                />
                <DetailRow
                  label="Manual"
                  value={
                    system.manualUrl ? (
                      isUrl(system.manualUrl) ? (
                        <a
                          href={system.manualUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Open document
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        system.manualUrl
                      )
                    ) : undefined
                  }
                />
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service provider</h3>
              {provider ? (
                <div className="rounded-lg border bg-surface/50 p-4">
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {provider.company || CONTACT_CATEGORY_META[provider.category].label}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${provider.phone.replace(/[^\d+]/g, "")}`}>
                          <Phone />
                          {provider.phone}
                        </a>
                      </Button>
                    )}
                    {provider.email && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${provider.email}`}>
                          <Mail />
                          Email
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/80">No provider linked yet.</p>
              )}
            </section>

            {system.notes && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
                <p className="whitespace-pre-wrap rounded-lg bg-surface/70 p-4 text-sm leading-relaxed">{system.notes}</p>
              </section>
            )}

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Service history
              </h3>
              {system.serviceLog.length > 0 ? (
                <ol className="relative ml-1.5 space-y-3 border-l pl-5">
                  {system.serviceLog.map((entry) => (
                    <li key={entry.id} className="relative text-sm">
                      <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-sage-500 ring-4 ring-card" />
                      <div className="font-medium">{formatDate(entry.date)}</div>
                      {entry.note && <div className="text-muted-foreground">{entry.note}</div>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground/80">Completed services will appear here.</p>
              )}
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
