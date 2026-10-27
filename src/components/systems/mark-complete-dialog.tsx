"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatInterval, getNextDue, hasInterval, todayISO } from "@/lib/domain";
import type { HomeSystem } from "@/lib/types";

export function MarkCompleteDialog({
  system,
  open,
  onOpenChange,
  onConfirm,
}: {
  system: HomeSystem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string, note: string) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setNote("");
    }
  }, [open]);

  if (!system) return null;
  const nextDue = hasInterval(system) ? getNextDue({ ...system, lastServiced: date || todayISO() }) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(date || todayISO(), note);
          }}
        >
          <DialogHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sage-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <DialogTitle>Mark as complete</DialogTitle>
            <DialogDescription>
              Log service for <span className="font-medium text-foreground">{system.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <Field label="Date completed" htmlFor="complete-date">
            <Input id="complete-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Note" htmlFor="complete-note" optional>
            <Textarea
              id="complete-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Replaced with MERV 11, cost $24"
              rows={2}
            />
          </Field>

          <div className="rounded-lg bg-muted/70 px-3.5 py-3 text-sm text-muted-foreground">
            {nextDue ? (
              <>
                {formatInterval(system.intervalValue, system.intervalUnit)} — next due{" "}
                <span className="font-medium text-foreground">{formatDate(nextDue)}</span>
              </>
            ) : (
              <>No repeat interval set, so this will be cleared from the schedule.</>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <CheckCircle2 />
              Mark complete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
