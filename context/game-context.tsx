"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { categoryLabel } from "@/lib/category-labels";
import type { DetectionSource, GameContextValue, TryOnResult } from "@/context/game-context-types";
import { detectGarmentFile, generateTryOnPreview } from "@/context/try-on-api-client";
import type { Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import { appendHistory } from "@/lib/history-storage";
import type { GarmentCategory, TryOnPhase } from "@/lib/types";

const GameContext = createContext<GameContextValue | null>(null);

function revokeUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function syncReadyState(args: {
  person: File | null;
  garment: File | null;
  cat: GarmentCategory | null;
}): TryOnPhase {
  if (args.person && args.garment && args.cat) {
    return "ready";
  }

  return "idle";
}

export function GameProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const [personFile, setPersonFileState] = useState<File | null>(null);
  const [garmentFile, setGarmentFileState] = useState<File | null>(null);
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null);
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<GarmentCategory | null>(null);
  const [detectionSource, setDetectionSource] = useState<DetectionSource | null>(null);
  const [phase, setPhase] = useState<TryOnPhase>("idle");
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const personRevokeRef = useRef<string | null>(null);
  const garmentRevokeRef = useRef<string | null>(null);
  const garmentVersionRef = useRef(0);
  const personFileRef = useRef<File | null>(null);

  const applyReadyOrIdle = useCallback((next: {
    person: File | null;
    garment: File | null;
    cat: GarmentCategory | null;
  }) => {
    setPhase(syncReadyState(next));
  }, []);

  const setPersonFile = useCallback(
    (file: File | null) => {
      setError(null);
      setResult(null);
      revokeUrl(personRevokeRef.current);
      personRevokeRef.current = null;

      if (!file) {
        personFileRef.current = null;
        setPersonFileState(null);
        setPersonPreviewUrl(null);
        applyReadyOrIdle({ person: null, garment: garmentFile, cat: category });

        return;
      }

      const url = URL.createObjectURL(file);

      personRevokeRef.current = url;
      personFileRef.current = file;
      setPersonFileState(file);
      setPersonPreviewUrl(url);
      applyReadyOrIdle({ person: file, garment: garmentFile, cat: category });
    },
    [applyReadyOrIdle, garmentFile, category],
  );

  const setGarmentFile = useCallback(
    (file: File | null) => {
      setError(null);
      setResult(null);
      setCategory(null);
      setDetectionSource(null);
      revokeUrl(garmentRevokeRef.current);
      garmentRevokeRef.current = null;

      if (!file) {
        setGarmentFileState(null);
        setGarmentPreviewUrl(null);
        applyReadyOrIdle({ person: personFile, garment: null, cat: null });

        return;
      }

      const url = URL.createObjectURL(file);

      garmentRevokeRef.current = url;
      setGarmentFileState(file);
      setGarmentPreviewUrl(url);
      setPhase("detecting");

      const token = garmentVersionRef.current + 1;

      garmentVersionRef.current = token;

      const detectCategory = async () => {
        setError(null);

        try {
          const detection = await detectGarmentFile(file, locale);

          if (garmentVersionRef.current !== token) {
            return;
          }

          setCategory(detection.category);
          setDetectionSource(detection.source);
          setPhase(
            syncReadyState({
              person: personFileRef.current,
              garment: file,
              cat: detection.category,
            }),
          );
        } catch (err) {
          if (garmentVersionRef.current !== token) {
            return;
          }

          const message = err instanceof Error ? err.message : "Detection failed";

          setError(message);
          setPhase("error");
        }
      };

      void detectCategory();
    },
    [applyReadyOrIdle, personFile, locale],
  );

  const generate = useCallback(async () => {
    if (!personFile || !garmentFile || !category) {
      setError(getUi(locale).tryOn.needBothForGenerate);

      return;
    }

    setPhase("generating");
    setError(null);

    try {
      const { dataUrl } = await generateTryOnPreview({ personFile, garmentFile, category });

      setResult({ dataUrl, mode: "live" });
      setPhase("success");
      appendHistory({
        category,
        resultDataUrl: dataUrl,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Try-on failed";

      setError(message);
      setPhase("error");
    }
  }, [personFile, garmentFile, category, locale]);

  const clearResult = useCallback(() => {
    setResult(null);
    setPhase(syncReadyState({ person: personFile, garment: garmentFile, cat: category }));
    setError(null);
  }, [personFile, garmentFile, category]);

  const resetSession = useCallback(() => {
    setPersonFile(null);
    setGarmentFile(null);
  }, [setPersonFile, setGarmentFile]);

  useEffect(
    () => () => {
      revokeUrl(personRevokeRef.current);
      revokeUrl(garmentRevokeRef.current);
    },
    [],
  );

  const categoryDisplay = category ? categoryLabel(category, locale) : null;

  const value = useMemo<GameContextValue>(
    () => ({
      personPreviewUrl,
      garmentPreviewUrl,
      personFile,
      garmentFile,
      category,
      categoryDisplay,
      detectionSource,
      phase,
      result,
      error,
      setPersonFile,
      setGarmentFile,
      generate,
      clearResult,
      resetSession,
    }),
    [
      personPreviewUrl,
      garmentPreviewUrl,
      personFile,
      garmentFile,
      category,
      categoryDisplay,
      detectionSource,
      phase,
      result,
      error,
      setPersonFile,
      setGarmentFile,
      generate,
      clearResult,
      resetSession,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);

  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }

  return ctx;
}
