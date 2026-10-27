import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-card text-sage-600 shadow-soft">
        <Compass className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">This room doesn’t exist</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">The page you’re looking for isn’t part of this home.</p>
      <Button asChild className="mt-6">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
