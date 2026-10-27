"use client";

import { Toaster } from "sonner";
import { AppActionsProvider } from "@/components/app-actions";
import { AppShell } from "@/components/app-shell";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Onboarding } from "@/components/onboarding";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={300}>
        <AppActionsProvider>
          <AppShell>{children}</AppShell>
          <KeyboardShortcuts />
          <Onboarding />
        </AppActionsProvider>
        <Toaster
          position="bottom-left"
          offset={20}
          mobileOffset={{ bottom: 84 }}
          toastOptions={{
            classNames: {
              toast:
                "!rounded-xl !border !border-border !bg-card !text-foreground !shadow-lift !font-sans !gap-3",
              description: "!text-muted-foreground",
              actionButton: "!bg-foreground !text-background !rounded-md !font-medium",
              success: "[&_[data-icon]]:!text-sage-600",
            },
          }}
        />
      </TooltipProvider>
    </StoreProvider>
  );
}
