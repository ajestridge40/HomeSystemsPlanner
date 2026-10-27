"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, Link2, Sparkles } from "lucide-react";
import { Field, FormSection } from "@/components/field";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_META, CONTACT_CATEGORY_META, INTERVAL_UNIT_LABEL, STATUS_META } from "@/lib/constants";
import { formatDate, getNextDue, isNextDueAutomatic } from "@/lib/domain";
import { useStore } from "@/lib/store";
import {
  INTERVAL_UNITS,
  SYSTEM_CATEGORIES,
  SYSTEM_STATUSES,
  type HomeSystem,
  type IntervalUnit,
  type SystemCategory,
  type SystemInput,
  type SystemStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const NONE = "__none__";

interface FormState {
  name: string;
  category: SystemCategory;
  location: string;
  brand: string;
  model: string;
  serialNumber: string;
  installDate: string;
  warrantyExpiration: string;
  notes: string;
  intervalValue: string;
  intervalUnit: IntervalUnit;
  lastServiced: string;
  nextDueManual: string;
  manualUrl: string;
  providerId: string;
  status: SystemStatus;
}

function toForm(s?: Partial<HomeSystem>): FormState {
  return {
    name: s?.name ?? "",
    category: s?.category ?? "hvac",
    location: s?.location ?? "",
    brand: s?.brand ?? "",
    model: s?.model ?? "",
    serialNumber: s?.serialNumber ?? "",
    installDate: s?.installDate ?? "",
    warrantyExpiration: s?.warrantyExpiration ?? "",
    notes: s?.notes ?? "",
    intervalValue: s?.intervalValue ? String(s.intervalValue) : "",
    intervalUnit: s?.intervalUnit ?? "months",
    lastServiced: s?.lastServiced ?? "",
    nextDueManual: s?.nextDueManual ?? "",
    manualUrl: s?.manualUrl ?? "",
    providerId: s?.providerId ?? NONE,
    status: s?.status ?? "good",
  };
}

function fromForm(f: FormState): SystemInput {
  const interval = parseInt(f.intervalValue, 10);
  const hasInterval = Number.isFinite(interval) && interval > 0;
  return {
    name: f.name.trim(),
    category: f.category,
    location: f.location.trim(),
    brand: f.brand.trim(),
    model: f.model.trim(),
    serialNumber: f.serialNumber.trim(),
    installDate: f.installDate || undefined,
    warrantyExpiration: f.warrantyExpiration || undefined,
    notes: f.notes.trim(),
    intervalValue: hasInterval ? interval : undefined,
    intervalUnit: hasInterval ? f.intervalUnit : undefined,
    lastServiced: f.lastServiced || undefined,
    nextDueManual: f.nextDueManual || undefined,
    manualUrl: f.manualUrl.trim(),
    providerId: f.providerId === NONE ? undefined : f.providerId,
    status: f.status,
  };
}

const NAME_HINTS: Record<SystemCategory, string> = {
  hvac: "e.g. Central air conditioner",
  electrical: "e.g. Main electrical panel",
  plumbing: "e.g. Tank water heater",
  appliances: "e.g. Refrigerator",
  warranties: "e.g. Home warranty plan",
  "service-providers": "e.g. Annual pest control plan",
  utilities: "e.g. Electric service",
  filters: "e.g. Furnace air filter",
  other: "e.g. Gutter cleaning",
};

export function SystemFormSheet({
  open,
  onOpenChange,
  system,
  defaults,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system?: HomeSystem | null;
  defaults?: Partial<HomeSystem>;
  onSaved?: (system: HomeSystem | null, created: boolean) => void;
}) {
  const { data, addSystem, updateSystem } = useStore();
  const [form, setForm] = useState<FormState>(() => toForm(system ?? defaults));
  const [touched, setTouched] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(system ?? defaults));
      setTouched(false);
    }
    // Reset only when the sheet opens or the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, system?.id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const preview = useMemo(() => fromForm(form), [form]);
  const automatic = isNextDueAutomatic(preview);
  const computedDue = getNextDue(preview);
  const nameError = touched && !form.name.trim();

  const sortedContacts = useMemo(
    () => [...data.contacts].sort((a, b) => a.name.localeCompare(b.name)),
    [data.contacts],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!form.name.trim()) {
      nameRef.current?.focus();
      return;
    }
    const input = fromForm(form);
    if (automatic) input.nextDueManual = undefined;
    if (system) {
      updateSystem(system.id, input);
      onSaved?.({ ...system, ...input }, false);
    } else {
      const created = addSystem(input);
      onSaved?.(created, true);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-xl"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          nameRef.current?.focus();
        }}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col" noValidate>
          <div className="border-b px-6 pb-5 pt-6">
            <div className="flex items-center gap-3">
              <CategoryIcon category={form.category} />
              <div>
                <SheetTitle>{system ? "Edit system" : "Add a system"}</SheetTitle>
                <SheetDescription className="mt-0.5">
                  {system ? "Update the details for this item." : "Capture what it is, where it lives, and how to care for it."}
                </SheetDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
            <FormSection title="Basics">
              <Field label="Name" htmlFor="sys-name">
                <Input
                  id="sys-name"
                  ref={nameRef}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={NAME_HINTS[form.category]}
                  aria-invalid={nameError}
                  className={cn(nameError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15")}
                />
                {nameError && <p className="text-xs text-destructive">Give this system a name so you can find it later.</p>}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <Select value={form.category} onValueChange={(v) => set("category", v as SystemCategory)}>
                    <SelectTrigger aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_META[c].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as SystemStatus)}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", STATUS_META[s].dot)} />
                            {STATUS_META[s].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Location in home" htmlFor="sys-location">
                <Input
                  id="sys-location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Basement utility room"
                />
              </Field>
            </FormSection>

            <FormSection title="Equipment details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Brand" htmlFor="sys-brand">
                  <Input id="sys-brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Carrier" />
                </Field>
                <Field label="Model" htmlFor="sys-model">
                  <Input id="sys-model" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Model number" />
                </Field>
              </div>
              <Field label="Serial number" htmlFor="sys-serial">
                <Input
                  id="sys-serial"
                  value={form.serialNumber}
                  onChange={(e) => set("serialNumber", e.target.value)}
                  placeholder="Usually on a sticker on the unit"
                  className="font-mono text-[13px] placeholder:font-sans"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Installed / purchased" htmlFor="sys-install">
                  <Input id="sys-install" type="date" value={form.installDate} onChange={(e) => set("installDate", e.target.value)} />
                </Field>
                <Field label="Warranty expires" htmlFor="sys-warranty">
                  <Input
                    id="sys-warranty"
                    type="date"
                    value={form.warrantyExpiration}
                    onChange={(e) => set("warrantyExpiration", e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Maintenance" description="Set an interval and we'll calculate the next due date for you.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Service interval">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={form.intervalValue}
                      onChange={(e) => set("intervalValue", e.target.value)}
                      placeholder="—"
                      aria-label="Interval amount"
                      className="w-20"
                    />
                    <Select value={form.intervalUnit} onValueChange={(v) => set("intervalUnit", v as IntervalUnit)}>
                      <SelectTrigger aria-label="Interval unit" className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVAL_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {INTERVAL_UNIT_LABEL[u][1]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
                <Field label="Last serviced" htmlFor="sys-last">
                  <Input id="sys-last" type="date" value={form.lastServiced} onChange={(e) => set("lastServiced", e.target.value)} />
                </Field>
              </div>

              {automatic ? (
                <div className="flex items-center gap-3 rounded-lg border border-sage-200 bg-sage-50 px-3.5 py-3 text-sm">
                  <Sparkles className="h-4 w-4 shrink-0 text-sage-600" />
                  <div className="text-sage-700">
                    Next due <span className="font-semibold">{formatDate(computedDue, "EEEE, MMM d, yyyy")}</span>
                    <span className="block text-xs text-sage-600/90">
                      Calculated from the {form.lastServiced ? "last service" : "install"} date.
                    </span>
                  </div>
                </div>
              ) : (
                <Field
                  label="Next due date"
                  htmlFor="sys-next"
                  optional
                  hint="For one-off tasks. Add an interval and a service date to schedule automatically."
                >
                  <div className="relative">
                    <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="sys-next"
                      type="date"
                      value={form.nextDueManual}
                      onChange={(e) => set("nextDueManual", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </Field>
              )}
            </FormSection>

            <FormSection title="Support">
              <Field label="Preferred service provider">
                <Select value={form.providerId} onValueChange={(v) => set("providerId", v)}>
                  <SelectTrigger aria-label="Preferred service provider">
                    <SelectValue placeholder="Choose a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No provider</SelectItem>
                    {sortedContacts.length > 0 && <SelectSeparator />}
                    {sortedContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        <span className="text-muted-foreground">
                          {" "}
                          · {c.company || CONTACT_CATEGORY_META[c.category].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sortedContacts.length === 0 && (
                  <p className="text-xs text-muted-foreground">Add contacts in the Contacts section to link them here.</p>
                )}
              </Field>
              <Field label="Manual or document" htmlFor="sys-manual" hint="Paste a link to a PDF, or note where the paper copy lives.">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sys-manual"
                    value={form.manualUrl}
                    onChange={(e) => set("manualUrl", e.target.value)}
                    placeholder="https://… or “Kitchen drawer, blue folder”"
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field label="Notes" htmlFor="sys-notes">
                <Textarea
                  id="sys-notes"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Shutoff locations, quirks, part numbers, anything someone else should know…"
                  rows={4}
                />
              </Field>
            </FormSection>
          </div>

          <div className="flex items-center justify-between gap-3 border-t bg-surface/60 px-6 py-4">
            <p className="hidden text-xs text-muted-foreground sm:block">Only a name is required.</p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none">
                {system ? "Save changes" : "Add system"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
