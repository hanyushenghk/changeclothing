import type { Metadata } from "next";

import { HistoryClient } from "@/app/history/history-client";

export const metadata: Metadata = {
  title: "History",
  description: "Try-on previews saved in this browser (local storage).",
  robots: { index: false, follow: true },
};

export default function HistoryPage() {
  return (
    <HistoryClient />
  );
}
