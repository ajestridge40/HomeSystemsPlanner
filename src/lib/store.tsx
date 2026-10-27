"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getNextDue, hasInterval, todayISO } from "./domain";
import { buildSampleData } from "./sample-data";
import { clearStoredData, emptyData, loadData, saveData } from "./storage";
import type { AppData, Contact, ContactInput, HomeSettings, HomeSystem, ISODate, SystemInput } from "./types";
import { createId } from "./utils";

interface StoreValue {
  data: AppData;
  hydrated: boolean;
  addSystem: (input: SystemInput) => HomeSystem;
  updateSystem: (id: string, input: Partial<SystemInput>) => void;
  deleteSystem: (id: string) => HomeSystem | undefined;
  restoreSystem: (system: HomeSystem) => void;
  /** Marks a system serviced and returns the previous version for undo. */
  markComplete: (id: string, date?: ISODate, note?: string) => HomeSystem | undefined;
  addContact: (input: ContactInput) => Contact;
  updateContact: (id: string, input: Partial<ContactInput>) => void;
  deleteContact: (id: string) => { contact: Contact; linkedSystemIds: string[] } | undefined;
  restoreContact: (contact: Contact, linkedSystemIds: string[]) => void;
  updateSettings: (patch: Partial<HomeSettings>) => void;
  replaceData: (data: AppData) => void;
  loadSample: (homeName?: string) => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [hydrated, setHydrated] = useState(false);
  // Mirrors state so action helpers can return values synchronously.
  const dataRef = useRef(data);
  // Set when state came from storage itself, so we don't write it straight back.
  const skipSaveRef = useRef(true);

  useEffect(() => {
    const loaded = loadData();
    dataRef.current = loaded;
    setData(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveData(data);
  }, [data, hydrated]);

  // Keep tabs in sync when data changes elsewhere.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("home-continuity")) {
        const loaded = loadData();
        dataRef.current = loaded;
        skipSaveRef.current = true;
        setData(loaded);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((updater: (prev: AppData) => AppData, touch = true) => {
    const next = updater(dataRef.current);
    const stamped = touch ? { ...next, updatedAt: new Date().toISOString() } : next;
    dataRef.current = stamped;
    setData(stamped);
  }, []);

  const addSystem = useCallback<StoreValue["addSystem"]>(
    (input) => {
      const now = new Date().toISOString();
      const system: HomeSystem = { ...input, id: createId("sys"), serviceLog: [], createdAt: now, updatedAt: now };
      commit((d) => ({ ...d, systems: [system, ...d.systems] }));
      return system;
    },
    [commit],
  );

  const updateSystem = useCallback<StoreValue["updateSystem"]>(
    (id, input) => {
      commit((d) => ({
        ...d,
        systems: d.systems.map((s) => (s.id === id ? { ...s, ...input, updatedAt: new Date().toISOString() } : s)),
      }));
    },
    [commit],
  );

  const deleteSystem = useCallback<StoreValue["deleteSystem"]>(
    (id) => {
      const existing = dataRef.current.systems.find((s) => s.id === id);
      commit((d) => ({ ...d, systems: d.systems.filter((s) => s.id !== id) }));
      return existing;
    },
    [commit],
  );

  const restoreSystem = useCallback<StoreValue["restoreSystem"]>(
    (system) => {
      commit((d) => ({
        ...d,
        systems: d.systems.some((s) => s.id === system.id)
          ? d.systems.map((s) => (s.id === system.id ? system : s))
          : [system, ...d.systems],
      }));
    },
    [commit],
  );

  const markComplete = useCallback<StoreValue["markComplete"]>(
    (id, date = todayISO(), note) => {
      const existing = dataRef.current.systems.find((s) => s.id === id);
      if (!existing) return undefined;
      commit((d) => ({
        ...d,
        systems: d.systems.map((s) => {
          if (s.id !== id) return s;
          const nextStatus = s.status === "critical" || s.status === "attention" ? "good" : s.status;
          return {
            ...s,
            lastServiced: date,
            // A manual due date is consumed by completion unless an interval will re-schedule it.
            nextDueManual: hasInterval(s) ? s.nextDueManual : undefined,
            status: nextStatus,
            serviceLog: [{ id: createId("log"), date, note: note?.trim() || undefined }, ...s.serviceLog],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      return existing;
    },
    [commit],
  );

  const addContact = useCallback<StoreValue["addContact"]>(
    (input) => {
      const now = new Date().toISOString();
      const contact: Contact = { ...input, id: createId("con"), createdAt: now, updatedAt: now };
      commit((d) => ({ ...d, contacts: [contact, ...d.contacts] }));
      return contact;
    },
    [commit],
  );

  const updateContact = useCallback<StoreValue["updateContact"]>(
    (id, input) => {
      commit((d) => ({
        ...d,
        contacts: d.contacts.map((c) => (c.id === id ? { ...c, ...input, updatedAt: new Date().toISOString() } : c)),
      }));
    },
    [commit],
  );

  const deleteContact = useCallback<StoreValue["deleteContact"]>(
    (id) => {
      const contact = dataRef.current.contacts.find((c) => c.id === id);
      if (!contact) return undefined;
      const linkedSystemIds = dataRef.current.systems.filter((s) => s.providerId === id).map((s) => s.id);
      commit((d) => ({
        ...d,
        contacts: d.contacts.filter((c) => c.id !== id),
        systems: d.systems.map((s) => (s.providerId === id ? { ...s, providerId: undefined } : s)),
      }));
      return { contact, linkedSystemIds };
    },
    [commit],
  );

  const restoreContact = useCallback<StoreValue["restoreContact"]>(
    (contact, linkedSystemIds) => {
      const linked = new Set(linkedSystemIds);
      commit((d) => ({
        ...d,
        contacts: [contact, ...d.contacts.filter((c) => c.id !== contact.id)],
        systems: d.systems.map((s) => (linked.has(s.id) && !s.providerId ? { ...s, providerId: contact.id } : s)),
      }));
    },
    [commit],
  );

  const updateSettings = useCallback<StoreValue["updateSettings"]>(
    (patch) => {
      // Onboarding flags alone shouldn't count as a data update.
      const touch = Object.keys(patch).some((k) => k !== "onboarded");
      commit((d) => ({ ...d, settings: { ...d.settings, ...patch } }), touch);
    },
    [commit],
  );

  const replaceData = useCallback<StoreValue["replaceData"]>(
    (next) => commit(() => ({ ...next, settings: { ...next.settings, onboarded: true } })),
    [commit],
  );

  const loadSample = useCallback<StoreValue["loadSample"]>(
    (homeName) => {
      const sample = buildSampleData(homeName);
      commit((d) => ({
        ...d,
        systems: [...sample.systems, ...d.systems],
        contacts: [...sample.contacts, ...d.contacts],
        settings: {
          ...d.settings,
          homeName: d.settings.homeName || sample.settings.homeName || "",
          address: d.settings.address || sample.settings.address || "",
          generalNotes: d.settings.generalNotes || sample.settings.generalNotes || "",
          onboarded: true,
        },
      }));
    },
    [commit],
  );

  const clearAll = useCallback(() => {
    clearStoredData();
    const fresh = emptyData();
    fresh.settings.onboarded = true;
    dataRef.current = fresh;
    setData(fresh);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      hydrated,
      addSystem,
      updateSystem,
      deleteSystem,
      restoreSystem,
      markComplete,
      addContact,
      updateContact,
      deleteContact,
      restoreContact,
      updateSettings,
      replaceData,
      loadSample,
      clearAll,
    }),
    [
      data,
      hydrated,
      addSystem,
      updateSystem,
      deleteSystem,
      restoreSystem,
      markComplete,
      addContact,
      updateContact,
      deleteContact,
      restoreContact,
      updateSettings,
      replaceData,
      loadSample,
      clearAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useContactMap() {
  const { data } = useStore();
  return useMemo(() => new Map(data.contacts.map((c) => [c.id, c])), [data.contacts]);
}

export function useSystemsWithDue() {
  const { data } = useStore();
  return useMemo(() => data.systems.map((s) => ({ system: s, nextDue: getNextDue(s) })), [data.systems]);
}
