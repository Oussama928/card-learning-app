"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import type { StudyCardTermDTO } from "@/types";
import { SpeakButton } from "./SpeakButton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface MCModeProps {
  activeCard: StudyCardTermDTO;
  mcOptions: string[];
  selectedOption: string;
  setSelectedOption: (val: string) => void;
  studyMode: string;
  currentDue: boolean | null;
  onNext: (isLearned: boolean) => Promise<void>;
  onBack: () => void;
  canGoBack: boolean;
  timeLimitSeconds: number | null;
  hintsEnabled: boolean;
}

export const MCMode: React.FC<MCModeProps> = ({
  activeCard,
  mcOptions,
  selectedOption,
  setSelectedOption,
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

  const hintText = buildHint(String(activeCard?.[1] ?? ""));

  return (
    <>
      <Card className="mt-6 w-full max-w-2xl text-center relative overflow-hidden">
        {_studyMode === "spaced_repetition" && currentDue && (
          <Badge variant="secondary" className="absolute top-4 right-4 animate-pulse">
            DUE
          </Badge>
        )}

        <CardHeader className="space-y-4 pb-2">
            {activeCard?.[4] && (
                <div className="w-full h-44 rounded-md overflow-hidden bg-muted/20 mb-4 border border-border">
                    <img
                        src={String(activeCard[4])}
                        alt="Expression visual"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold text-muted-foreground">
                    What is the translation of:
                </CardTitle>
                 <SpeakButton text={String(activeCard?.[0] ?? "")} label="Play pronunciation" />
            </div>
        </CardHeader>

        <CardContent className="space-y-6">
            <div className="text-3xl font-bold text-primary">
                {activeCard[0]}
            </div>

            {hintsEnabled && hintText && (
                 <div className="flex justify-center">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/20 px-3 py-1">
                        Hint: {hintText}
                    </Badge>
                 </div>
            )}

            <div className="grid grid-cols-2 gap-4 w-full">
                {mcOptions.map((option, idx) => (
                    <Button
                        key={idx}
                        onClick={() => setSelectedOption(option)}
                        variant={selectedOption === option ? "default" : "outline"}
                        className="h-14 text-lg whitespace-normal"
                    >
                        {option}
                    </Button>
                ))}
            </div>

            <Button
                onClick={() => void onNext(selectedOption === activeCard?.[1])}
                disabled={!selectedOption}
                className="w-full h-12 font-medium max-w-xs mx-auto block"
                size="lg"
            >
                Submit
            </Button>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack || timeLimitSeconds !== null}
          className="h-14 w-14 rounded-full border-border hover:border-primary disabled:opacity-50"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>
     </>
  );
};
