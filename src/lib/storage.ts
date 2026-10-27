import { STORAGE_KEY } from "./constants";
import {
  CONTACT_CATEGORIES,
  INTERVAL_UNITS,
  SYSTEM_CATEGORIES,
  SYSTEM_STATUSES,
  type AppData,
  type Contact,
  type HomeSettings,
  type HomeSystem,
} from "./types";
import { createId } from "./utils";

export const DEFAULT_SETTINGS: HomeSettings = {
  homeName: "",
  address: "",
  ownerName: "",
  generalNotes: "",
  onboarded: false,
};

export function emptyData(): AppData {
  return { version: 1, systems: [], contacts: [], settings: { ...DEFAULT_SETTINGS }, updatedAt: null };
}

/* ---------- Normalization (defensive against old or hand-edited JSON) ---------- */

type Loose = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const optStr = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback;

function normalizeSystem(raw: Loose): HomeSystem {
  const now = new Date().toISOString();
  const intervalValue = Number(raw.intervalValue);
  return {
    id: str(raw.id) || createId("sys"),
    name: str(raw.name, "Untitled system") || "Untitled system",
    category: oneOf(raw.category, SYSTEM_CATEGORIES, "other"),
    location: str(raw.location),
    brand: str(raw.brand),
    model: str(raw.model),
    serialNumber: str(raw.serialNumber),
    installDate: optStr(raw.installDate),
    warrantyExpiration: optStr(raw.warrantyExpiration),
    notes: str(raw.notes),
    intervalValue: Number.isFinite(intervalValue) && intervalValue > 0 ? Math.round(intervalValue) : undefined,
    intervalUnit: raw.intervalUnit ? oneOf(raw.intervalUnit, INTERVAL_UNITS, "months") : undefined,
    lastServiced: optStr(raw.lastServiced),
    nextDueManual: optStr(raw.nextDueManual),
    manualUrl: str(raw.manualUrl),
    providerId: optStr(raw.providerId),
    status: oneOf(raw.status, SYSTEM_STATUSES, "good"),
    serviceLog: Array.isArray(raw.serviceLog)
      ? (raw.serviceLog as Loose[])
          .filter((e) => e && typeof e.date === "string")
          .map((e) => ({ id: str(e.id) || createId("log"), date: e.date as string, note: optStr(e.note) }))
      : [],
    createdAt: str(raw.createdAt, now) || now,
    updatedAt: str(raw.updatedAt, now) || now,
  };
}

function normalizeContact(raw: Loose): Contact {
  const now = new Date().toISOString();
  return {
    id: str(raw.id) || createId("con"),
    name: str(raw.name, "Unnamed contact") || "Unnamed contact",
    company: str(raw.company),
    phone: str(raw.phone),
    email: str(raw.email),
    notes: str(raw.notes),
    category: oneOf(raw.category, CONTACT_CATEGORIES, "other"),
    isEmergency: Boolean(raw.isEmergency),
    createdAt: str(raw.createdAt, now) || now,
    updatedAt: str(raw.updatedAt, now) || now,
  };
}

export function normalizeData(input: unknown): AppData {
  if (!input || typeof input !== "object") throw new Error("File does not contain a Home Continuity backup.");
  const raw = input as Loose;
  if (!Array.isArray(raw.systems) && !Array.isArray(raw.contacts)) {
    throw new Error("Backup is missing systems and contacts.");
  }
  const settings = (raw.settings && typeof raw.settings === "object" ? raw.settings : {}) as Loose;
  const contacts = (Array.isArray(raw.contacts) ? raw.contacts : []).filter(Boolean).map((c) => normalizeContact(c as Loose));
  const contactIds = new Set(contacts.map((c) => c.id));
  const systems = (Array.isArray(raw.systems) ? raw.systems : [])
    .filter(Boolean)
    .map((s) => normalizeSystem(s as Loose))
    .map((s) => (s.providerId && !contactIds.has(s.providerId) ? { ...s, providerId: undefined } : s));

  return {
    version: 1,
    systems,
    contacts,
    settings: {
      homeName: str(settings.homeName),
      address: str(settings.address),
      ownerName: str(settings.ownerName),
      generalNotes: str(settings.generalNotes),
      onboarded: settings.onboarded === undefined ? true : Boolean(settings.onboarded),
    },
    updatedAt: optStr(raw.updatedAt) ?? null,
  };
}

/* ---------- localStorage ---------- */

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const stored = JSON.parse(raw) as { settings?: { onboarded?: boolean } };
    const data = normalizeData(stored);
    // Keep the stored onboarding flag exactly (normalizeData treats imports as already onboarded).
    data.settings.onboarded = Boolean(stored.settings?.onboarded);
    return data;
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
