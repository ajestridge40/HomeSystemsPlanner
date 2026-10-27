import {
  Box,
  Droplets,
  Filter,
  Flame,
  Hammer,
  HardHat,
  Heart,
  Home,
  Landmark,
  Leaf,
  type LucideIcon,
  PlugZap,
  Refrigerator,
  ShieldCheck,
  Bug,
  UserRound,
  Wrench,
  Wind,
  Zap,
} from "lucide-react";
import type { ContactCategory, IntervalUnit, SystemCategory, SystemStatus } from "./types";

export const STORAGE_KEY = "home-continuity:v1";

interface CategoryMeta {
  label: string;
  short: string;
  icon: LucideIcon;
  /** Tailwind classes for the small icon tile */
  tile: string;
  /** Hex used for calendar dots and print */
  dot: string;
  /** Whether brand/model details are expected for completeness */
  equipment: boolean;
}

export const CATEGORY_META: Record<SystemCategory, CategoryMeta> = {
  hvac: { label: "HVAC", short: "HVAC", icon: Wind, tile: "bg-sky-50 text-sky-700 ring-sky-100", dot: "#0284c7", equipment: true },
  electrical: { label: "Electrical", short: "Electrical", icon: Zap, tile: "bg-amber-50 text-amber-700 ring-amber-100", dot: "#d97706", equipment: true },
  plumbing: { label: "Plumbing", short: "Plumbing", icon: Droplets, tile: "bg-cyan-50 text-cyan-700 ring-cyan-100", dot: "#0891b2", equipment: true },
  appliances: { label: "Appliances", short: "Appliances", icon: Refrigerator, tile: "bg-violet-50 text-violet-700 ring-violet-100", dot: "#7c3aed", equipment: true },
  warranties: { label: "Warranties", short: "Warranty", icon: ShieldCheck, tile: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "#059669", equipment: false },
  "service-providers": { label: "Service Providers", short: "Service", icon: HardHat, tile: "bg-orange-50 text-orange-700 ring-orange-100", dot: "#ea580c", equipment: false },
  utilities: { label: "Utilities", short: "Utility", icon: PlugZap, tile: "bg-yellow-50 text-yellow-700 ring-yellow-100", dot: "#ca8a04", equipment: false },
  filters: { label: "Filters & Consumables", short: "Filters", icon: Filter, tile: "bg-teal-50 text-teal-700 ring-teal-100", dot: "#0d9488", equipment: true },
  other: { label: "Other", short: "Other", icon: Box, tile: "bg-stone-100 text-stone-700 ring-stone-200", dot: "#78716c", equipment: false },
};

interface StatusMeta {
  label: string;
  badge: string;
  dot: string;
}

export const STATUS_META: Record<SystemStatus, StatusMeta> = {
  good: { label: "Good", badge: "bg-sage-50 text-sage-700 ring-sage-200", dot: "bg-sage-500" },
  attention: { label: "Needs attention", badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  critical: { label: "Critical", badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
};

export const CONTACT_CATEGORY_META: Record<ContactCategory, { label: string; icon: LucideIcon }> = {
  plumber: { label: "Plumber", icon: Droplets },
  electrician: { label: "Electrician", icon: Zap },
  hvac: { label: "HVAC Technician", icon: Flame },
  handyman: { label: "Handyman", icon: Hammer },
  utility: { label: "Utility Company", icon: PlugZap },
  insurance: { label: "Insurance", icon: Landmark },
  "appliance-repair": { label: "Appliance Repair", icon: Wrench },
  landscaping: { label: "Landscaping", icon: Leaf },
  "pest-control": { label: "Pest Control", icon: Bug },
  neighbor: { label: "Neighbor", icon: Home },
  family: { label: "Family", icon: Heart },
  other: { label: "Other", icon: UserRound },
};

export const INTERVAL_UNIT_LABEL: Record<IntervalUnit, [string, string]> = {
  days: ["day", "days"],
  weeks: ["week", "weeks"],
  months: ["month", "months"],
  years: ["year", "years"],
};

