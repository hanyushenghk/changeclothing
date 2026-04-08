"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryLabel } from "@/lib/category-labels";
import {
  deleteHistoryEntry,
  loadHistory,
  type HistoryEntry,
} from "@/lib/history-storage";

export function HistoryClient() {
  const [rows, setRows] = useState<HistoryEntry[]>(() => loadHistory());

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">History</h1>
        <p className="text-muted-foreground">
          Stored locally in this browser for now. Sign-in sync is planned for a later release.
        </p>
      </div>
      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No previews yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a try-on preview first, then it will show up here.
            </p>
            <Link href="/try" className={cn(buttonVariants())}>
              Start try-on
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Card key={row.id} className="overflow-hidden">
              <div className="relative aspect-[3/4] bg-muted">
                <Image
                  src={row.resultDataUrl}
                  alt="Saved try-on preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{categoryLabel(row.category)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={row.resultDataUrl}
                    download={`tryon-${row.id}.png`}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1 text-center")}
                  >
                    Download
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setRows(deleteHistoryEntry(row.id));
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
