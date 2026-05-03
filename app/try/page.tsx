import type { Metadata } from "next";

import { GameProvider } from "@/context/game-context";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { TryOnWorkspace } from "@/components/try-on/try-on-workspace";

const tryDescription =
  "Upload your photo and a garment image to generate a virtual try-on preview for shopping reference.";

export const metadata: Metadata = {
  title: "Try on",
  description: tryDescription,
  alternates: { canonical: "/try" },
  openGraph: {
    title: "Try on · ChangeClothing",
    description: tryDescription,
    url: "/try",
  },
  twitter: {
    title: "Try on · ChangeClothing",
    description: tryDescription,
  },
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
