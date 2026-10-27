"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Download, GraduationCap, HardDrive, Keyboard, RotateCcw, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { normalizeData } from "@/lib/storage";
import { useStore } from "@/lib/store";
import type { AppData } from "@/lib/types";
import { pluralize } from "@/lib/utils";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 py-8 first:pt-0 md:grid-cols-[240px_1fr] md:gap-10">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { data, hydrated, updateSettings, replaceData, clearAll, loadSample } = useStore();
  const [form, setForm] = useState({ homeName: "", address: "", ownerName: "", generalNotes: "" });
  const [pendingImport, setPendingImport] = useState<{ data: AppData; fileName: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated) {
      const { homeName, address, ownerName, generalNotes } = data.settings;
      setForm({ homeName, address, ownerName, generalNotes });
    }
    // Sync the form when stored settings change (e.g. after import or clear).
  }, [hydrated, data.settings]);

  if (!hydrated) return <PageSkeleton cards={0} />;

  const dirty =
    form.homeName !== data.settings.homeName ||
    form.address !== data.settings.address ||
    form.ownerName !== data.settings.ownerName ||
    form.generalNotes !== data.settings.generalNotes;

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      homeName: form.homeName.trim(),
      address: form.address.trim(),
      ownerName: form.ownerName.trim(),
      generalNotes: form.generalNotes.trim(),
    });
    toast.success("Home details saved");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = (data.settings.homeName || "home").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `home-continuity-${slug || "home"}-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded", { description: `${pluralize(data.systems.length, "system")}, ${pluralize(data.contacts.length, "contact")}` });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = normalizeData(JSON.parse(text));
      setPendingImport({ data: parsed, fileName: file.name });
    } catch (err) {
      toast.error("Couldn’t import that file", {
        description: err instanceof SyntaxError ? "It isn’t valid JSON." : (err as Error).message,
      });
    }
  };

  const hasData = data.systems.length > 0 || data.contacts.length > 0;

  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" description="Your home’s details, backups, and data." />

      <div className="divide-y">
        <SettingsSection title="Home details" description="Shown on your dashboard and at the top of the handoff report.">
          <Card className="p-5">
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Home name" htmlFor="set-name" optional>
                  <Input
                    id="set-name"
                    value={form.homeName}
                    onChange={(e) => setForm((f) => ({ ...f, homeName: e.target.value }))}
                    placeholder="e.g. Maple Street House"
                  />
                </Field>
                <Field label="Prepared by" htmlFor="set-owner" optional>
                  <Input
                    id="set-owner"
                    value={form.ownerName}
                    onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                    placeholder="Your name"
                  />
                </Field>
              </div>
              <Field label="Address" htmlFor="set-address" optional>
                <Input
                  id="set-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street, city"
                  autoComplete="street-address"
                />
              </Field>
              <Field
                label="Household notes"
                htmlFor="set-notes"
                optional
                hint="Spare keys, Wi-Fi, trash day, alarm code hints — anything a house-sitter needs. Included in the handoff report."
              >
                <Textarea
                  id="set-notes"
                  value={form.generalNotes}
                  onChange={(e) => setForm((f) => ({ ...f, generalNotes: e.target.value }))}
                  rows={4}
                  placeholder="e.g. Spare key is with the neighbors at #1430…"
                />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={!dirty}>
                  Save details
                </Button>
              </div>
            </form>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Backup & restore"
          description="Your data lives only in this browser. Export a backup regularly, or move it to another device."
        >
          <Card className="divide-y">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Export all data</div>
                <div className="text-[13px] text-muted-foreground">Download a JSON file with every system, contact and setting.</div>
              </div>
              <Button variant="outline" onClick={exportJson} disabled={!hasData} className="shrink-0">
                <Download />
                Export JSON
              </Button>
            </div>
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Import from backup</div>
                <div className="text-[13px] text-muted-foreground">Replaces current data with a Home Continuity JSON export.</div>
              </div>
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="shrink-0">
                <Upload />
                Import JSON
              </Button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
            </div>
            <div className="flex items-center gap-3 bg-surface/50 px-5 py-3 text-[13px] text-muted-foreground">
              <HardDrive className="h-4 w-4 shrink-0" />
              <span>
                {pluralize(data.systems.length, "system")} · {pluralize(data.contacts.length, "contact")}
                {data.updatedAt && <> · last changed {format(new Date(data.updatedAt), "MMM d, yyyy 'at' h:mm a")}</>}
              </span>
            </div>
          </Card>
        </SettingsSection>

        <SettingsSection title="Getting started" description="Revisit the introduction, or explore with example data.">
          <Card className="divide-y">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Replay onboarding</div>
                <div className="text-[13px] text-muted-foreground">See the 3-step introduction again.</div>
              </div>
              <Button variant="outline" className="shrink-0" onClick={() => updateSettings({ onboarded: false })}>
                <GraduationCap />
                Replay
              </Button>
            </div>
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Add sample home data</div>
                <div className="text-[13px] text-muted-foreground">Adds a dozen example systems and contacts alongside your own.</div>
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  loadSample();
                  toast.success("Sample data added");
                }}
              >
                <Sparkles />
                Add samples
              </Button>
            </div>
          </Card>
        </SettingsSection>

        <SettingsSection title="Keyboard shortcuts" description="Move quickly without reaching for the mouse.">
          <Card className="p-5">
            <ul className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["New system", ["N"]],
                ["New contact", ["C"]],
                ["Search systems", ["/"]],
                ["Go to page", ["1", "–", "5"]],
                ["Close dialog", ["Esc"]],
                ["Save form", ["Enter"]],
              ].map(([label, keys]) => (
                <li key={label as string} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Keyboard className="h-3.5 w-3.5" />
                    {label}
                  </span>
                  <span className="flex items-center gap-1">
                    {(keys as string[]).map((k) => (k === "–" ? <span key={k} className="text-muted-foreground">–</span> : <Kbd key={k}>{k}</Kbd>))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </SettingsSection>

        <SettingsSection title="Danger zone" description="Permanently remove everything stored by Home Continuity in this browser.">
          <Card className="border-rose-200">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">Clear all data</div>
                <div className="text-[13px] text-muted-foreground">
                  Deletes all systems, contacts and settings. Export a backup first if you might need it.
                </div>
              </div>
              <Button variant="destructive" className="shrink-0" onClick={() => setConfirmClear(true)}>
                <Trash2 />
                Clear data
              </Button>
            </div>
          </Card>
        </SettingsSection>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(o) => !o && setPendingImport(null)}
        title="Replace your current data?"
        description={
          pendingImport && (
            <>
              <span className="font-medium text-foreground">{pendingImport.fileName}</span> contains{" "}
              {pluralize(pendingImport.data.systems.length, "system")} and {pluralize(pendingImport.data.contacts.length, "contact")}.
              {hasData && " Everything currently saved here will be replaced."}
            </>
          )
        }
        confirmLabel="Replace data"
        onConfirm={() => {
          if (!pendingImport) return;
          replaceData(pendingImport.data);
          toast.success("Backup imported", {
            description: `${pluralize(pendingImport.data.systems.length, "system")}, ${pluralize(pendingImport.data.contacts.length, "contact")}`,
          });
          setPendingImport(null);
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear all data?"
        description="This permanently deletes every system, contact, and setting stored in this browser. This can’t be undone."
        confirmLabel="Yes, clear everything"
        onConfirm={() => {
          clearAll();
          toast("All data cleared", { icon: <RotateCcw className="h-4 w-4" /> });
        }}
      />
    </div>
  );
}
