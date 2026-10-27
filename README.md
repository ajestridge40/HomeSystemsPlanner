# Home Continuity

A calm, private planner for everything that keeps a home running. Inventory critical systems, track maintenance, keep trusted contacts close, and generate a printable handoff report for house-sitters, buyers, or family.

## Features

- **Dashboard**: systems tracked, maintenance due in the next 30 days, missing critical info, last updated, upcoming tasks, and key contacts.
- **Systems inventory**: nine categories, with location, brand/model/serial, install and warranty dates, service interval, last serviced, an auto-calculated next due date, a manual link, a linked provider, status, and service history.
- **Maintenance**: a timeline grouped by urgency plus a month calendar, filters by category and status, warranty expirations, and one-click "mark complete" (with undo).
- **Contacts**: emergency and service contacts, tap to call or email, and linking to systems.
- **Handoff report**: a print-ready summary of the whole home, with sections you can switch on and off. Use your browser's print dialog to save it as a PDF.
- **Settings**: home name, address and notes; export and import a JSON backup; clear all data; replay onboarding; load sample data.
- **Polish**: a 3-step onboarding, toasts with undo, confirmation before anything destructive, and keyboard shortcuts (`N` new system, `C` new contact, `/` search, `1`–`5` switch pages).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui (Radix) · Lucide · Framer Motion · date-fns · Sonner

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
npm run typecheck
```

## Data

Everything is stored in `localStorage` under the single key `home-continuity:v1`, as an `AppData` object (`src/lib/types.ts`). Nothing leaves the browser. Imported backups are validated and normalized (`src/lib/storage.ts`).

## Project structure

```
src/
  app/                 routes: dashboard, systems, maintenance, contacts, report, settings
  components/
    ui/                shadcn/ui primitives
    systems/           system form, detail sheet, card/row, mark-complete dialog
    contacts/          contact form, link-systems dialog
    app-actions.tsx    globally mounted editors and dialogs, opened from anywhere
    app-shell.tsx      sidebar, mobile top bar and bottom nav
    onboarding.tsx     first-run flow
  lib/
    types.ts           data model
    domain.ts          due-date math, missing-info rules, maintenance events
    store.tsx          React context and localStorage persistence
    storage.ts         load/save/normalize
    sample-data.ts     example home (dates relative to today)
```
