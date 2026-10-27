"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Link2, Mail, MoreHorizontal, Pencil, Phone, Search, SearchX, Siren, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useAppActions } from "@/components/app-actions";
import { LinkSystemsDialog } from "@/components/contacts/link-systems-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTACT_CATEGORY_META } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { CONTACT_CATEGORIES, type Contact, type ContactCategory, type HomeSystem } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function ContactCard({
  contact,
  linked,
  onLink,
}: {
  contact: Contact;
  linked: HomeSystem[];
  onLink: (c: Contact) => void;
}) {
  const { openContactForm, confirmDeleteContact, openSystemDetail } = useAppActions();
  const meta = CONTACT_CATEGORY_META[contact.category];
  const Icon = meta.icon;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn’t copy to clipboard");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex flex-col rounded-xl border bg-card p-4 shadow-soft transition-all duration-200 hover:border-stone-300 hover:shadow-lift",
        contact.isEmergency && "border-rose-100",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            contact.isEmergency ? "bg-rose-50 text-rose-700" : "bg-sage-50 text-sage-700",
          )}
        >
          {initials(contact.name) || <Icon className="h-4 w-4" />}
          {contact.isEmergency && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white ring-2 ring-card">
              <Siren className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium leading-snug">{contact.name}</div>
          <div className="truncate text-[13px] text-muted-foreground">{contact.company || meta.label}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-1.5 -mt-1 opacity-60 transition-opacity data-[state=open]:bg-muted group-hover:opacity-100"
              aria-label={`Actions for ${contact.name}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openContactForm({ contact })}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLink(contact)}>
              <Link2 />
              Link systems
            </DropdownMenuItem>
            {contact.phone && (
              <DropdownMenuItem onSelect={() => copy(contact.phone, "Phone number")}>
                <Copy />
                Copy phone
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => confirmDeleteContact(contact.id)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>

      {contact.notes && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{contact.notes}</p>}

      <div className="mt-3 text-xs text-muted-foreground">
        {linked.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            <span>Services:</span>
            {linked.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => openSystemDetail(s.id)}
                className="rounded bg-surface px-1.5 py-0.5 font-medium text-foreground/80 ring-1 ring-border transition-colors hover:bg-muted"
              >
                {s.name}
              </button>
            ))}
            {linked.length > 3 && <span>+{linked.length - 3}</span>}
          </div>
        ) : (
          <button onClick={() => onLink(contact)} className="inline-flex items-center gap-1 hover:text-foreground">
            <Link2 className="h-3 w-3" />
            Link to systems
          </button>
        )}
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        {contact.phone ? (
          <Button size="sm" variant="outline" className="tabular flex-1" asChild>
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
              <Phone className="text-sage-600" />
              {contact.phone}
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="flex-1 text-muted-foreground" onClick={() => openContactForm({ contact })}>
            <Phone />
            Add phone
          </Button>
        )}
        {contact.email && (
          <Button size="icon-sm" variant="outline" asChild>
            <a href={`mailto:${contact.email}`} aria-label={`Email ${contact.name}`}>
              <Mail />
            </a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function ContactsPage() {
  const { data, hydrated } = useStore();
  const { openContactForm } = useAppActions();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ContactCategory | "all">("all");
  const [linkTarget, setLinkTarget] = useState<Contact | null>(null);

  const linkedMap = useMemo(() => {
    const map = new Map<string, HomeSystem[]>();
    data.systems.forEach((s) => {
      if (s.providerId) map.set(s.providerId, [...(map.get(s.providerId) ?? []), s]);
    });
    return map;
  }, [data.systems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.contacts
      .filter((c) => category === "all" || c.category === category)
      .filter(
        (c) =>
          !q ||
          [c.name, c.company, c.phone, c.email, c.notes, CONTACT_CATEGORY_META[c.category].label].join(" ").toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.contacts, query, category]);

  if (!hydrated) return <PageSkeleton cards={0} />;

  const emergency = filtered.filter((c) => c.isEmergency);
  const others = filtered.filter((c) => !c.isEmergency);
  const presentCategories = CONTACT_CATEGORIES.filter((c) => data.contacts.some((x) => x.category === c));

  const grid = (list: Contact[]) => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence initial={false} mode="popLayout">
        {list.map((c) => (
          <ContactCard key={c.id} contact={c} linked={linkedMap.get(c.id) ?? []} onLink={setLinkTarget} />
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Emergency numbers, service pros, utilities and insurance — one tap away."
        actions={
          <Button onClick={() => openContactForm()}>
            <UserPlus />
            Add contact
          </Button>
        }
      />

      {data.contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Start with the calls you’d make in an emergency: your plumber, electrician, HVAC tech, and the power and water companies."
        >
          <Button onClick={() => openContactForm({ defaults: { category: "plumber", isEmergency: true } })}>
            <UserPlus />
            Add an emergency contact
          </Button>
          <Button variant="outline" onClick={() => openContactForm({ defaults: { category: "utility" } })}>
            Add a utility
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts…"
                className="pl-9 pr-9"
                aria-label="Search contacts"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as ContactCategory | "all")}>
              <SelectTrigger className="sm:w-[200px]" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {presentCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CONTACT_CATEGORY_META[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState compact className="mt-6" icon={SearchX} title="No matching contacts" description="Try a different name or category.">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <div className="mt-6 space-y-8">
              {emergency.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-rose-700">
                    <Siren className="h-4 w-4" />
                    Emergency
                  </h2>
                  {grid(emergency)}
                </section>
              )}
              {others.length > 0 && (
                <section>
                  {emergency.length > 0 && <h2 className="mb-3 text-[13px] font-semibold text-foreground">Everyone else</h2>}
                  {grid(others)}
                </section>
              )}
            </div>
          )}
        </>
      )}

      <LinkSystemsDialog contact={linkTarget} open={linkTarget !== null} onOpenChange={(o) => !o && setLinkTarget(null)} />
    </div>
  );
}
