"use client";

import { CheckCircle2, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAppActions } from "@/components/app-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNextDue } from "@/lib/domain";
import type { HomeSystem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SystemActionsMenu({ system, className }: { system: HomeSystem; className?: string }) {
  const { openSystemDetail, openSystemForm, openMarkComplete, confirmDeleteSystem } = useAppActions();
  const schedulable = Boolean(getNextDue(system));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("text-muted-foreground data-[state=open]:bg-muted", className)}
          aria-label={`Actions for ${system.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => openSystemDetail(system.id)}>
          <Eye />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openSystemForm({ system })}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        {schedulable && (
          <DropdownMenuItem onSelect={() => openMarkComplete(system.id)}>
            <CheckCircle2 />
            Mark complete
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => confirmDeleteSystem(system.id)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
