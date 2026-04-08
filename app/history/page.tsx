import { SiteHeader } from "@/components/site-header";
import { HistoryClient } from "@/app/history/history-client";

export const metadata = {
  title: "History · ChangeClothing",
};

export default function HistoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <HistoryClient />
    </div>
  );
}
