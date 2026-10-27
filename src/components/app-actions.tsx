"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { ContactFormDialog } from "@/components/contacts/contact-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MarkCompleteDialog } from "@/components/systems/mark-complete-dialog";
import { SystemDetailSheet } from "@/components/systems/system-detail";
import { SystemFormSheet } from "@/components/systems/system-form";
import { formatDate, getNextDue } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Contact, HomeSystem } from "@/lib/types";

interface AppActions {
  openSystemForm: (opts?: { system?: HomeSystem; defaults?: Partial<HomeSystem> }) => void;
  openSystemDetail: (id: string) => void;
  openMarkComplete: (id: string) => void;
  confirmDeleteSystem: (id: string) => void;
  openContactForm: (opts?: { contact?: Contact; defaults?: Partial<Contact> }) => void;
  confirmDeleteContact: (id: string) => void;
}

const ActionsContext = createContext<AppActions | null>(null);

/**
 * Hosts every editor sheet and dialog once, so any page (or keyboard shortcut)
 * can open them without duplicating wiring.
 */
export function AppActionsProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const { data } = store;

  const [systemForm, setSystemForm] = useState<{ open: boolean; system?: HomeSystem; defaults?: Partial<HomeSystem> }>({
    open: false,
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [deleteSystemId, setDeleteSystemId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<{ open: boolean; contact?: Contact; defaults?: Partial<Contact> }>({
    open: false,
  });
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  // Keep the last-opened item around while sheets animate closed.
  const [detailSnapshot, setDetailSnapshot] = useState<string | null>(null);
  const [completeSnapshot, setCompleteSnapshot] = useState<string | null>(null);

  const findSystem = useCallback((id: string | null) => (id ? data.systems.find((s) => s.id === id) ?? null : null), [data.systems]);
  const detailSystem = findSystem(detailId ?? detailSnapshot);
  const completeSystem = findSystem(completeId ?? completeSnapshot);
  const systemToDelete = findSystem(deleteSystemId);
  const contactToDelete = deleteContactId ? data.contacts.find((c) => c.id === deleteContactId) ?? null : null;

  const openSystemForm = useCallback<AppActions["openSystemForm"]>((opts) => {
    setSystemForm({ open: true, system: opts?.system, defaults: opts?.defaults });
  }, []);

  const openSystemDetail = useCallback((id: string) => {
    setDetailId(id);
    setDetailSnapshot(id);
  }, []);

  const openMarkComplete = useCallback((id: string) => {
    setCompleteId(id);
    setCompleteSnapshot(id);
  }, []);

  const openContactForm = useCallback<AppActions["openContactForm"]>((opts) => {
    setContactForm({ open: true, contact: opts?.contact, defaults: opts?.defaults });
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      openSystemForm,
      openSystemDetail,
      openMarkComplete,
      confirmDeleteSystem: setDeleteSystemId,
      openContactForm,
      confirmDeleteContact: setDeleteContactId,
    }),
    [openSystemForm, openSystemDetail, openMarkComplete, openContactForm],
  );

  const handleComplete = (date: string, note: string) => {
    if (!completeId) return;
    const previous = store.markComplete(completeId, date, note);
    setCompleteId(null);
    if (!previous) return;
    const next = getNextDue({ ...previous, lastServiced: date, nextDueManual: undefined });
    toast.success(`${previous.name} marked complete`, {
      description: next ? `Next due ${formatDate(next)}` : "Removed from the schedule",
      action: { label: "Undo", onClick: () => store.restoreSystem(previous) },
    });
  };

  const handleDeleteSystem = () => {
    if (!deleteSystemId) return;
    const removed = store.deleteSystem(deleteSystemId);
    setDeleteSystemId(null);
    if (detailId === deleteSystemId) setDetailId(null);
    if (removed) {
      toast(`Deleted “${removed.name}”`, {
        action: { label: "Undo", onClick: () => store.restoreSystem(removed) },
      });
    }
  };

  const handleDeleteContact = () => {
    if (!deleteContactId) return;
    const result = store.deleteContact(deleteContactId);
    setDeleteContactId(null);
    if (result) {
      toast(`Deleted “${result.contact.name}”`, {
        action: { label: "Undo", onClick: () => store.restoreContact(result.contact, result.linkedSystemIds) },
      });
    }
  };

  const linkedCount = contactToDelete ? data.systems.filter((s) => s.providerId === contactToDelete.id).length : 0;

  return (
    <ActionsContext.Provider value={actions}>
      {children}

      <SystemFormSheet
        open={systemForm.open}
        onOpenChange={(open) => setSystemForm((s) => ({ ...s, open }))}
        system={systemForm.system}
        defaults={systemForm.defaults}
        onSaved={(saved, created) => {
          if (!saved) return;
          toast.success(created ? "System added" : "Changes saved", {
            description: saved.name,
            action: created ? { label: "View", onClick: () => openSystemDetail(saved.id) } : undefined,
          });
        }}
      />

      <SystemDetailSheet
        system={detailSystem}
        open={detailId !== null && detailSystem !== null}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(s) => {
          setDetailId(null);
          openSystemForm({ system: s });
        }}
        onComplete={(s) => openMarkComplete(s.id)}
        onDelete={(s) => setDeleteSystemId(s.id)}
      />

      <MarkCompleteDialog
        system={completeSystem}
        open={completeId !== null && completeSystem !== null}
        onOpenChange={(open) => !open && setCompleteId(null)}
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={systemToDelete !== null}
        onOpenChange={(open) => !open && setDeleteSystemId(null)}
        title="Delete this system?"
        description={
          <>
            <span className="font-medium text-foreground">{systemToDelete?.name}</span> and its service history will be
            removed. You can undo right after.
          </>
        }
        onConfirm={handleDeleteSystem}
      />

      <ContactFormDialog
        open={contactForm.open}
        onOpenChange={(open) => setContactForm((s) => ({ ...s, open }))}
        contact={contactForm.contact}
        defaults={contactForm.defaults}
        onSaved={(saved, created) => toast.success(created ? "Contact added" : "Contact updated", { description: saved.name })}
      />

      <ConfirmDialog
        open={contactToDelete !== null}
        onOpenChange={(open) => !open && setDeleteContactId(null)}
        title="Delete this contact?"
        description={
          <>
            <span className="font-medium text-foreground">{contactToDelete?.name}</span> will be removed
            {linkedCount > 0 ? ` and unlinked from ${linkedCount} ${linkedCount === 1 ? "system" : "systems"}` : ""}.
          </>
        }
        onConfirm={handleDeleteContact}
      />
    </ActionsContext.Provider>
  );
}

export function useAppActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useAppActions must be used within AppActionsProvider");
  return ctx;
}
