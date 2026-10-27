export const SYSTEM_CATEGORIES = [
  "hvac",
  "electrical",
  "plumbing",
  "appliances",
  "warranties",
  "service-providers",
  "utilities",
  "filters",
  "other",
] as const;
export type SystemCategory = (typeof SYSTEM_CATEGORIES)[number];

export const SYSTEM_STATUSES = ["good", "attention", "critical"] as const;
export type SystemStatus = (typeof SYSTEM_STATUSES)[number];

export const INTERVAL_UNITS = ["days", "weeks", "months", "years"] as const;
export type IntervalUnit = (typeof INTERVAL_UNITS)[number];

export const CONTACT_CATEGORIES = [
  "plumber",
  "electrician",
  "hvac",
  "handyman",
  "utility",
  "insurance",
  "appliance-repair",
  "landscaping",
  "pest-control",
  "neighbor",
  "family",
  "other",
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

/** Dates are stored as ISO calendar dates: "yyyy-MM-dd". */
export type ISODate = string;

export interface ServiceLogEntry {
  id: string;
  date: ISODate;
  note?: string;
}

export interface HomeSystem {
  id: string;
  name: string;
  category: SystemCategory;
  location: string;
  brand: string;
  model: string;
  serialNumber: string;
  installDate?: ISODate;
  warrantyExpiration?: ISODate;
  notes: string;
  intervalValue?: number;
  intervalUnit?: IntervalUnit;
  lastServiced?: ISODate;
  /** Manual due date, used only when no interval-based date can be calculated. */
  nextDueManual?: ISODate;
  manualUrl: string;
  providerId?: string;
  status: SystemStatus;
  serviceLog: ServiceLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
  category: ContactCategory;
  isEmergency: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeSettings {
  homeName: string;
  address: string;
  ownerName: string;
  generalNotes: string;
  onboarded: boolean;
}

export interface AppData {
  version: 1;
  systems: HomeSystem[];
  contacts: Contact[];
  settings: HomeSettings;
  updatedAt: string | null;
}

export type SystemInput = Omit<HomeSystem, "id" | "createdAt" | "updatedAt" | "serviceLog">;
export type ContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt">;
