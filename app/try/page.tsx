import { GameProvider } from "@/context/game-context";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { TryOnWorkspace } from "@/components/try-on/try-on-workspace";

export const metadata = {
  title: "Try on · ChangeClothing",
};

export default function TryOnPage() {
  return (
    <GameProvider>
      <div className="relative flex-1 overflow-hidden rounded-2xl">
        <GlowingEffect
          disabled={false}
          proximity={1000}
          inactiveZone={0}
          spread={64}
          movementDuration={0.6}
          glow
          blur={2}
          borderWidth={2}
          className="z-10 rounded-2xl"
        />
        <TryOnWorkspace />
      </div>
    </GameProvider>
  );
}
