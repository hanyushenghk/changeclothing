import Link from "next/link";

import { ArrowRight, Camera, Shirt, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-16 sm:px-6">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Purchase-reference previews · Not sizing advice
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              See clothes on{" "}
              <span className="underline decoration-primary decoration-2 underline-offset-8">
                you
              </span>
              , before you buy.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              ChangeClothing is a low-friction virtual try-on web tool for overseas shoppers. Upload
              your photo and a clothing image— we detect the garment type and render a still preview
              designed for shopping context, not tailoring precision.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/try"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Start free try-on
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/history" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
                View history
              </Link>
            </div>
          </div>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shirt className="size-5" aria-hidden />
                Built for repeat use
              </CardTitle>
              <CardDescription>
                Keep your photo for the session, swap outfits, and stack previews while you browse
                stores.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-xl border bg-muted/40 p-4">
                <Camera className="size-6 text-primary" aria-hidden />
                <p className="font-medium">Your photo + one garment</p>
                <p className="text-sm text-muted-foreground">
                  Top, bottom, or dress—one piece per preview in V1.
                </p>
              </div>
              <div className="space-y-2 rounded-xl border bg-muted/40 p-4">
                <Sparkles className="size-6 text-primary" aria-hidden />
                <p className="font-medium">Auto category</p>
                <p className="text-sm text-muted-foreground">
                  We label upper, lower, or dress before generation.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
