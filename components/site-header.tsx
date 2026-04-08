import Link from "next/link";

import { Shirt } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shirt className="size-4" aria-hidden />
          </span>
          <span>ChangeClothing</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/try" className={cn(buttonVariants({ variant: "ghost" }))}>
            Try on
          </Link>
          <Link href="/history" className={cn(buttonVariants({ variant: "ghost" }))}>
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
