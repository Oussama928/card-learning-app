"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import type { StudyCardTermDTO } from "@/types";
import { SpeakButton } from "./SpeakButton";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface FlashcardModeProps {
  activeCard: StudyCardTermDTO;
  side: number;
  setSide: (val: number | ((prev: number) => number)) => void;
  studyMode: string;
  currentDue: boolean | null;
  onNext: (isLearned: boolean) => Promise<void>;
  onBack: () => void;
  canGoBack: boolean;
  timeLimitSeconds: number | null;
  hintsEnabled: boolean;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  activeCard,
  side,
  setSide,
  studyMode: _studyMode,
  currentDue,
  onNext,
  onBack,
  canGoBack,
  timeLimitSeconds,
  hintsEnabled,
}) => {
  const buildHint = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.length <= 2) return trimmed[0] ? `${trimmed[0]}…` : trimmed;
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    return `${first}${"•".repeat(Math.max(trimmed.length - 2, 1))}${last}`;
  };

  const hintTarget = side === 0 ? String(activeCard?.[1] ?? "") : String(activeCard?.[0] ?? "");
  const hintText = buildHint(hintTarget);

  return (
    <>
      <Card
        onClick={() => setSide((prev) => (prev + 1) % 2)}
        className="mt-6 flex h-80 w-full max-w-2xl cursor-pointer flex-col justify-center border-border bg-card shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
      >
        {_studyMode === "spaced_repetition" && currentDue && (
          <Badge variant="secondary" className="absolute top-4 right-4 animate-pulse">
            DUE
          </Badge>
        )}
        
        {activeCard[4] && side === 0 && (
          <img
            src={String(activeCard[4])}
            alt="Expression visual"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
        )}
        
        <CardContent className="relative z-10 w-full p-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-muted-foreground">
              {side === 0 ? "Expression" : "Translation"}
            </h2>
            <SpeakButton text={String(activeCard?.[side] ?? "")} label="Play pronunciation" />
          </div>
          
          <div className={`text-center text-4xl font-bold tracking-wide ${side === 0 ? "text-primary" : "text-foreground"}`}>
            {activeCard[side]}
          </div>

          {hintsEnabled && hintText && side === 0 && (
            <div className="mt-8 text-center">
              <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                Hint: {hintText}
              </Badge>
            </div>
          )}
          
          <p className="absolute bottom-6 left-0 right-0 text-center text-sm uppercase tracking-widest text-muted-foreground/50">
            Click to Flip
          </p>
        </CardContent>
      </Card>

      <div className="mt-12 flex items-center justify-center gap-6 w-full max-w-2xl">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack || timeLimitSeconds !== null}
          className="h-14 w-14 rounded-full border-border hover:border-primary disabled:opacity-50"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <div className="flex gap-4 flex-1 justify-center">
          <Button
            variant="destructive"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              void onNext(false);
            }}
            className="flex-1 max-w-[200px] h-14 text-lg font-bold rounded-2xl"
          >
            I failed
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              void onNext(true);
            }}
            className="flex-1 max-w-[200px] h-14 text-lg font-bold rounded-2xl shadow-lg hover:shadow-primary/20"
          >
            I mastered it
          </Button>
        </div>
      </div>
    </>
  );
};
