"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppActions } from "@/components/app-actions";
import { NAV } from "@/components/app-shell";

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

/** N = new system, C = new contact, 1–5 = navigate. Ignored while typing or when a dialog is open. */
export function KeyboardShortcuts() {
  const router = useRouter();
  const { openSystemForm, openContactForm } = useAppActions();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if (isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        openSystemForm();
      } else if (key === "c") {
        e.preventDefault();
        openContactForm();
      } else {
        const item = NAV.find((n) => n.key === key);
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, openSystemForm, openContactForm]);

  return null;
}
