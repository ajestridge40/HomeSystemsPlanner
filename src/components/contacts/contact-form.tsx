"use client";

import { useEffect, useRef, useState } from "react";
import { Siren } from "lucide-react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_CATEGORY_META } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { CONTACT_CATEGORIES, type Contact, type ContactCategory, type ContactInput } from "@/lib/types";
import { cn } from "@/lib/utils";

function toForm(c?: Partial<Contact>): ContactInput {
  return {
    name: c?.name ?? "",
    company: c?.company ?? "",
    phone: c?.phone ?? "",
    email: c?.email ?? "",
    notes: c?.notes ?? "",
    category: c?.category ?? "plumber",
    isEmergency: c?.isEmergency ?? false,
  };
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  defaults,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  defaults?: Partial<Contact>;
  onSaved?: (contact: Contact, created: boolean) => void;
}) {
  const { addContact, updateContact } = useStore();
  const [form, setForm] = useState<ContactInput>(() => toForm(contact ?? defaults));
  const [touched, setTouched] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(contact ?? defaults));
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact?.id]);

  const set = <K extends keyof ContactInput>(key: K, value: ContactInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const nameError = touched && !form.name.trim();
  const emailError = touched && form.email.trim() !== "" && !/^\S+@\S+\.\S+$/.test(form.email.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!form.name.trim()) {
      nameRef.current?.focus();
      return;
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return;
    const input: ContactInput = {
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    };
    if (contact) {
      updateContact(contact.id, input);
      onSaved?.({ ...contact, ...input }, false);
    } else {
      onSaved?.(addContact(input), true);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          nameRef.current?.focus();
        }}
      >
        <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>{contact ? "Edit contact" : "Add a contact"}</DialogTitle>
            <DialogDescription>The people and companies who keep this home running.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="con-name">
              <Input
                id="con-name"
                ref={nameRef}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Dana Ortiz"
                aria-invalid={nameError}
                className={cn(nameError && "border-destructive")}
              />
              {nameError && <p className="text-xs text-destructive">A name is required.</p>}
            </Field>
            <Field label="Company" htmlFor="con-company" optional>
              <Input id="con-company" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Ortiz Plumbing" />
            </Field>
            <Field label="Phone" htmlFor="con-phone">
              <Input
                id="con-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </Field>
            <Field label="Email" htmlFor="con-email" optional>
              <Input
                id="con-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@company.com"
                aria-invalid={emailError}
                className={cn(emailError && "border-destructive")}
              />
              {emailError && <p className="text-xs text-destructive">That email doesn’t look quite right.</p>}
            </Field>
            <Field label="Category" className="sm:col-span-2">
              <Select value={form.category} onValueChange={(v) => set("category", v as ContactCategory)}>
                <SelectTrigger aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CONTACT_CATEGORY_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notes" htmlFor="con-notes" optional className="sm:col-span-2">
              <Textarea
                id="con-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Account numbers, hours, who to ask for…"
                rows={3}
              />
            </Field>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={form.isEmergency}
            onClick={() => set("isEmergency", !form.isEmergency)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              form.isEmergency ? "border-rose-200 bg-rose-50/70" : "hover:bg-muted/50",
            )}
          >
            <Siren className={cn("h-4 w-4 shrink-0", form.isEmergency ? "text-rose-600" : "text-muted-foreground")} />
            <span className="flex-1">
              <span className="block text-sm font-medium">Emergency contact</span>
              <span className="block text-xs text-muted-foreground">Pinned to the top of contacts and the handoff report.</span>
            </span>
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                form.isEmergency ? "bg-rose-500" : "bg-stone-300",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  form.isEmergency ? "translate-x-[18px]" : "translate-x-0.5",
                )}
              />
            </span>
          </button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{contact ? "Save changes" : "Add contact"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
