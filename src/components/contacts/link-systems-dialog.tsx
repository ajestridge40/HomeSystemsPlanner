"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATEGORY_META } from "@/lib/constants";
import { useContactMap, useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Assign a contact as the preferred provider for any number of systems. */
export function LinkSystemsDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, updateSystem } = useStore();
  const contacts = useContactMap();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open && contact) {
      setSelected(new Set(data.systems.filter((s) => s.providerId === contact.id).map((s) => s.id)));
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact?.id]);

  const systems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.systems]
      .filter((s) => !q || `${s.name} ${s.location} ${CATEGORY_META[s.category].label}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.systems, query]);

  if (!contact) return null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = () => {
    let changed = 0;
    data.systems.forEach((s) => {
      const linked = s.providerId === contact.id;
      const want = selected.has(s.id);
      if (want && !linked) {
        updateSystem(s.id, { providerId: contact.id });
        changed++;
      } else if (!want && linked) {
        updateSystem(s.id, { providerId: undefined });
        changed++;
      }
    });
    onOpenChange(false);
    if (changed) {
      toast.success("Links updated", {
        description: `${contact.name} is linked to ${selected.size} ${selected.size === 1 ? "system" : "systems"}.`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Link systems</DialogTitle>
          <DialogDescription>
            Choose which systems <span className="font-medium text-foreground">{contact.name}</span> services.
          </DialogDescription>
        </DialogHeader>
        {data.systems.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">Add some systems first, then link them here.</p>
        ) : (
          <>
            <div className="px-6 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter systems…" className="pl-9" />
              </div>
            </div>
            <ul className="max-h-[320px] overflow-y-auto border-y px-2 py-2" role="listbox" aria-multiselectable>
              {systems.map((s) => {
                const isOn = selected.has(s.id);
                const other = s.providerId && s.providerId !== contact.id ? contacts.get(s.providerId) : undefined;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isOn}
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none",
                        isOn && "bg-sage-50/70 hover:bg-sage-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isOn ? "border-sage-600 bg-sage-600 text-white" : "border-input bg-card",
                        )}
                      >
                        {isOn && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <CategoryIcon category={s.category} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{s.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {other && !isOn ? `Currently: ${other.name}` : s.location || CATEGORY_META[s.category].label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {systems.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</li>}
            </ul>
          </>
        )}
        <DialogFooter className="p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {data.systems.length > 0 && <Button onClick={save}>Save links</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
