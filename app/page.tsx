import Link from "next/link";

import { ArrowRight, Camera, Shirt, Sparkles } from "lucide-react";

import { HomeAuth } from "@/components/home-auth";
import { Container } from "@/components/theme/container";
import { DisplayHeading, SectionLabel } from "@/components/theme/heading";
import { Lead } from "@/components/theme/paragraph";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <Container>
      <div className="sidefolio-section flex flex-col">
      <div className="space-y-4">
        <span className="text-3xl">👋</span>
        <SectionLabel>Overview</SectionLabel>
      </div>
      <main>
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-500">
              Purchase-reference previews · Not sizing advice
            </p>
            <DisplayHeading className="text-4xl sm:text-5xl">
              See clothes on{" "}
              <span className="underline decoration-primary decoration-2 underline-offset-8">
                you
              </span>
              , before you buy.
            </DisplayHeading>
            <Lead className="max-w-xl text-lg leading-relaxed">
              ChangeClothing is a low-friction virtual try-on web tool for overseas shoppers. Upload
              your photo and a clothing image— we detect the garment type and render a still preview
              designed for shopping context, not tailoring precision.
            </Lead>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/try"
                className={cn(buttonVariants({ size: "lg" }), "gap-2 rounded-xl shadow-sm")}
              >
                Start free try-on
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/history"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-xl border-neutral-300")}
              >
                View history
              </Link>
            </div>
            <HomeAuth />
          </div>
          <Card className="sidefolio-card border-dashed bg-neutral-50/40">
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
    </Container>
  );
}
