import type { GarmentCategory, TryOnMode, TryOnPhase } from "@/lib/types";

export type TryOnResult = {
  dataUrl: string;
  mode: TryOnMode;
};

export type DetectionSource = "gemini";

export type GameContextValue = {
  personPreviewUrl: string | null;
  garmentPreviewUrl: string | null;
  personFile: File | null;
  garmentFile: File | null;
  category: GarmentCategory | null;
  categoryDisplay: string | null;
  detectionSource: DetectionSource | null;
  phase: TryOnPhase;
  result: TryOnResult | null;
  error: string | null;
  setPersonFile: (file: File | null) => void;
  setGarmentFile: (file: File | null) => void;
  generate: () => Promise<void>;
  clearResult: () => void;
  resetSession: () => void;
};
