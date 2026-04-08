"use client";

import Link from "next/link";

import Image from "next/image";

import { AlertTriangle, Loader2, Sparkles, Wand2 } from "lucide-react";

import { useGame } from "@/context/game-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageDropZone } from "@/components/try-on/image-drop-zone";

export function TryOnWorkspace() {
  const {
    personPreviewUrl,
    garmentPreviewUrl,
    phase,
    categoryDisplay,
    detectionSource,
    result,
    error,
    setPersonFile,
    setGarmentFile,
    generate,
    clearResult,
    resetSession,
    personFile,
    garmentFile,
  } = useGame();

  const busy = phase === "detecting" || phase === "generating";
  const canGenerate = Boolean(personFile && garmentFile && phase === "ready");

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Virtual try-on preview
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Upload one photo of yourself and one clothing image. We auto-detect the garment type and
          generate a static preview for purchase consideration—not a fit or size guarantee.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Reference only</AlertTitle>
        <AlertDescription>
          Results are try-on preview images for shopping context. They are not sizing advice or a
          promise of how the garment will look in person.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4" aria-hidden />
              Inputs
            </CardTitle>
            <CardDescription>Your photo stays in this session until you refresh or reset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageDropZone
              label="Your photo"
              description="Everyday photos work. Clearer shots usually preview better."
              previewUrl={personPreviewUrl}
              disabled={busy}
              onFile={setPersonFile}
            />
            <Separator />
            <ImageDropZone
              label="Clothing image"
              description="Any product or flat lay image. Category is detected automatically."
              previewUrl={garmentPreviewUrl}
              disabled={busy}
              onFile={setGarmentFile}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Detected category</span>
              {categoryDisplay ? (
                <Badge variant="secondary">{categoryDisplay}</Badge>
              ) : (
                <Badge variant="outline">Waiting for clothing image</Badge>
              )}
              {detectionSource ? (
                <span className="text-xs text-muted-foreground">
                  ({detectionSource === "gemini" ? "vision model" : "local fallback"})
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="gap-2"
                disabled={!canGenerate || busy}
                onClick={() => void generate()}
              >
                {phase === "generating" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Generating preview…
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" aria-hidden />
                    Generate preview
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => clearResult()}>
                Clear result
              </Button>
              <Button type="button" variant="ghost" onClick={() => resetSession()}>
                Reset session
              </Button>
            </div>
            {phase === "detecting" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Detecting garment category…
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>
              Configure{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">REPLICATE_API_TOKEN</code> for
              full generation. Without it, the API echoes your photo as a{" "}
              <strong>placeholder</strong> while you wire the UI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result?.dataUrl ? (
              <>
                {result.mode === "placeholder" ? (
                  <Alert>
                    <AlertTitle>Placeholder mode</AlertTitle>
                    <AlertDescription>
                      Connect a try-on backend (see <code>.env.example</code>) to produce a real
                      composite. This preview shows your original photo only.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="overflow-hidden rounded-xl border bg-muted/30">
                  <Image
                    src={result.dataUrl}
                    alt="Try-on preview"
                    width={900}
                    height={1200}
                    className="w-full object-contain"
                    unoptimized
                  />
                </div>
                <a
                  href={result.dataUrl}
                  download="changeclothing-tryon.png"
                  className={cn(buttonVariants({ variant: "secondary" }))}
                >
                  Download PNG
                </a>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                <Wand2 className="size-10 opacity-40" aria-hidden />
                <p>Your preview lands here—usually within 10–20 seconds when a backend is connected.</p>
                <Link href="/history" className={cn(buttonVariants({ variant: "link" }))}>
                  View saved previews in History
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
