"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarCheck2, ClipboardList, FileText, HousePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: ClipboardList,
    eyebrow: "Step 1 of 3",
    title: "Everything about your home, in one calm place",
    body: "Inventory the systems that keep your home running — HVAC, plumbing, electrical, appliances, warranties — with the model numbers, locations and quirks that usually live in someone’s head.",
  },
  {
    icon: CalendarCheck2,
    eyebrow: "Step 2 of 3",
    title: "Never wonder when something was last serviced",
    body: "Set a simple interval and Home Continuity schedules the next service for you. Mark it done in one click and the calendar takes care of the rest.",
  },
  {
    icon: FileText,
    eyebrow: "Step 3 of 3",
    title: "Hand off your home with confidence",
    body: "Traveling, selling, or helping a parent? Generate a clean, printable report with every system, upcoming task and trusted contact — ready for whoever’s next.",
  },
];

export function Onboarding() {
  const { data, hydrated, updateSettings, loadSample } = useStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [homeName, setHomeName] = useState("");
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hydrated && !data.settings.onboarded) setOpen(true);
  }, [hydrated, data.settings.onboarded]);

  const isNameStep = step === STEPS.length;

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = (withSample: boolean) => {
    const name = homeName.trim();
    if (withSample) {
      if (name) updateSettings({ homeName: name });
      loadSample(name || undefined);
      toast.success("Sample home loaded", { description: "Explore freely — you can clear it any time in Settings." });
    } else {
      updateSettings({ onboarded: true, ...(name ? { homeName: name } : {}) });
      toast.success(name ? `Welcome home to ${name}` : "You’re all set", {
        description: "Start by adding your first system.",
      });
    }
    setOpen(false);
  };

  const skip = () => {
    updateSettings({ onboarded: true });
    setOpen(false);
  };

  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && skip()}>
      <DialogContent
        hideClose
        className="max-w-[440px] gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          continueRef.current?.focus({ preventScroll: true });
        }}
      >
        <div className="relative h-36 overflow-hidden border-b bg-gradient-to-br from-sage-50 via-background to-amber-50/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--sage-100))_0,transparent_55%)]" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative flex h-full items-center justify-center"
            >
              {isNameStep ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-card shadow-lift">
                  <HousePlus className="h-7 w-7 text-sage-600" strokeWidth={1.5} />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-card shadow-lift">
                  <current.icon className="h-7 w-7 text-sage-600" strokeWidth={1.5} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="absolute left-5 top-4">
            <Logo compact />
          </div>
        </div>

        <div className="relative min-h-[232px] px-6 pb-2 pt-6">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {isNameStep ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    finish(false);
                  }}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-sage-600">Last thing</p>
                  <DialogTitle className="mt-2 text-xl leading-snug">What should we call your home?</DialogTitle>
                  <DialogDescription className="mt-2 leading-relaxed">
                    This appears on your dashboard and handoff report. You can change it later.
                  </DialogDescription>
                  <div className="mt-5 space-y-1.5">
                    <Label htmlFor="onboard-name">Home name</Label>
                    <Input
                      id="onboard-name"
                      autoFocus
                      value={homeName}
                      onChange={(e) => setHomeName(e.target.value)}
                      placeholder="e.g. The Lake House, Mom’s place"
                    />
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-sage-600">{current.eyebrow}</p>
                  <DialogTitle className="mt-2 text-xl leading-snug text-balance">{current.title}</DialogTitle>
                  <DialogDescription className="mt-2.5 leading-relaxed">{current.body}</DialogDescription>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-4">
          <div className="flex items-center gap-1.5" aria-hidden>
            {[...STEPS, null].map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-5 bg-sage-600" : "w-1.5 bg-stone-300",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step === 0 ? (
              <Button variant="ghost" size="sm" onClick={skip}>
                Skip
              </Button>
            ) : (
              <Button variant="ghost" size="icon-sm" onClick={() => go(step - 1)} aria-label="Back">
                <ArrowLeft />
              </Button>
            )}
            {isNameStep ? (
              <Button size="sm" onClick={() => finish(false)}>
                Get started
              </Button>
            ) : (
              <Button ref={continueRef} size="sm" onClick={() => go(step + 1)}>
                Continue
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>

        {isNameStep && (
          <button
            type="button"
            onClick={() => finish(true)}
            className="flex w-full items-center justify-center gap-2 border-t bg-surface/70 px-6 py-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-sage-600" />
            Or explore with a sample home first
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
