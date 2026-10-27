import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { CATEGORY_META, INTERVAL_UNIT_LABEL } from "./constants";
import type { HomeSystem, ISODate, IntervalUnit } from "./types";

/* ---------- Dates ---------- */

export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

/** Parses a stored "yyyy-MM-dd" as a local date (avoids UTC off-by-one). */
export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? startOfDay(d) : null;
}

export function formatDate(value?: string | null, pattern = "MMM d, yyyy"): string {
  const d = parseDate(value);
  return d ? format(d, pattern) : "—";
}

export function formatRelative(value?: string | null): string {
  if (!value) return "Never";
  const d = parseISO(value);
  if (!isValid(d)) return "—";
  return `${formatDistanceToNowStrict(d)} ago`;
}

export function daysUntil(value?: string | null): number | null {
  const d = parseDate(value);
  return d ? differenceInCalendarDays(d, startOfDay(new Date())) : null;
}

export function describeDue(days: number | null): string {
  if (days === null) return "Not scheduled";
  if (days < -1) return `${Math.abs(days)} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days < 30) return `Due in ${days} days`;
  const months = Math.round(days / 30);
  return `Due in ~${months} ${months === 1 ? "month" : "months"}`;
}

export function addInterval(date: Date, value: number, unit: IntervalUnit): Date {
  switch (unit) {
    case "days":
      return addDays(date, value);
    case "weeks":
      return addWeeks(date, value);
    case "months":
      return addMonths(date, value);
    case "years":
      return addYears(date, value);
  }
}

export function formatInterval(value?: number, unit?: IntervalUnit): string {
  if (!value || !unit) return "—";
  const [one, many] = INTERVAL_UNIT_LABEL[unit];
  return value === 1 ? `Every ${one}` : `Every ${value} ${many}`;
}

/* ---------- Systems ---------- */

export function hasInterval(s: Pick<HomeSystem, "intervalValue" | "intervalUnit">): boolean {
  return Boolean(s.intervalValue && s.intervalValue > 0 && s.intervalUnit);
}

/** True when next-due can be derived automatically from the interval. */
export function isNextDueAutomatic(
  s: Pick<HomeSystem, "intervalValue" | "intervalUnit" | "lastServiced" | "installDate">,
): boolean {
  return hasInterval(s) && Boolean(parseDate(s.lastServiced) || parseDate(s.installDate));
}

export function getNextDue(
  s: Pick<HomeSystem, "intervalValue" | "intervalUnit" | "lastServiced" | "installDate" | "nextDueManual">,
): ISODate | undefined {
  if (hasInterval(s)) {
    const base = parseDate(s.lastServiced) ?? parseDate(s.installDate);
    if (base) return toISODate(addInterval(base, s.intervalValue!, s.intervalUnit!));
  }
  return parseDate(s.nextDueManual) ? s.nextDueManual : undefined;
}

export interface MissingField {
  key: string;
  label: string;
}

export function getMissingInfo(s: HomeSystem): MissingField[] {
  const missing: MissingField[] = [];
  const meta = CATEGORY_META[s.category];
  if (!s.location.trim() && s.category !== "service-providers" && s.category !== "utilities") {
    missing.push({ key: "location", label: "Location" });
  }
  if (meta.equipment) {
    if (!s.brand.trim()) missing.push({ key: "brand", label: "Brand" });
    if (!s.model.trim()) missing.push({ key: "model", label: "Model" });
  }
  if (hasInterval(s) && !s.lastServiced && !s.installDate) {
    missing.push({ key: "lastServiced", label: "Last serviced date" });
  }
  if (s.category === "warranties" && !s.warrantyExpiration) {
    missing.push({ key: "warrantyExpiration", label: "Warranty expiration" });
  }
  if ((s.category === "hvac" || s.category === "plumbing" || s.category === "electrical") && !s.providerId) {
    missing.push({ key: "providerId", label: "Service provider" });
  }
  return missing;
}

/* ---------- Maintenance events ---------- */

export type EventKind = "maintenance" | "warranty";

export interface MaintenanceEvent {
  id: string;
  kind: EventKind;
  date: ISODate;
  days: number;
  system: HomeSystem;
}

export function buildEvents(systems: HomeSystem[], opts: { includeWarranties?: boolean } = {}): MaintenanceEvent[] {
  const events: MaintenanceEvent[] = [];
  for (const system of systems) {
    const due = getNextDue(system);
    if (due) {
      events.push({ id: `${system.id}:m`, kind: "maintenance", date: due, days: daysUntil(due)!, system });
    }
    if (opts.includeWarranties && system.warrantyExpiration && parseDate(system.warrantyExpiration)) {
      events.push({
        id: `${system.id}:w`,
        kind: "warranty",
        date: system.warrantyExpiration,
        days: daysUntil(system.warrantyExpiration)!,
        system,
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function upcomingWithin(systems: HomeSystem[], days: number): MaintenanceEvent[] {
  return buildEvents(systems).filter((e) => e.days <= days);
}
