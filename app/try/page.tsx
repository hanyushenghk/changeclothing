import { GameProvider } from "@/context/game-context";
import { SiteHeader } from "@/components/site-header";
import { TryOnWorkspace } from "@/components/try-on/try-on-workspace";

export const metadata = {
  title: "Try on · ChangeClothing",
};

export default function TryOnPage() {
  return (
    <GameProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <TryOnWorkspace />
      </div>
    </GameProvider>
  );
}
