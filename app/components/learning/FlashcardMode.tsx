"use client";

import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import type { StudyCardTermDTO } from "@/types";
import { SpeakButton } from "./SpeakButton";

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
  studyMode,
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
      <div
        onClick={() => setSide((prev) => (prev + 1) % 2)}
        className="mt-6 flex h-80 w-full max-w-2xl cursor-pointer items-center justify-center rounded-[40px] border border-white/20 bg-gradient-to-br from-gray-800 to-gray-700 p-12 text-center shadow-2xl transition-transform hover:scale-105 active:scale-95 relative overflow-hidden"
      >
        {studyMode === "spaced_repetition" && currentDue && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-teal-500 text-white text-xs font-bold uppercase tracking-wider animate-pulse transition-all">
            Due
          </div>
        )}
        {activeCard[4] && side === 0 ? (
          <img
            src={String(activeCard[4])}
            alt="Expression visual"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        ) : null}
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between">
            <h2
              className="mb-4 text-2xl font-semibold text-gray-400"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {side === 0 ? "Expression" : "Translation"}
            </h2>
            <SpeakButton text={String(activeCard?.[side] ?? "")} label="Play pronunciation" />
          </div>
          <div
            className={`text-5xl font-black text-white ${
              side === 0 ? "text-teal-300" : "text-amber-300"
            }`}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: "1px",
            }}
          >
            {activeCard[side]}
          </div>
          {hintsEnabled && hintText ? (
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-amber-300">
              Hint: {hintText}
            </p>
          ) : null}
          <p className="mt-8 text-sm uppercase tracking-widest text-gray-500">
            Click to Flip
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-12">
        <button
          onClick={onBack}
          disabled={!canGoBack || timeLimitSeconds !== null}
          className="group flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-gray-600 transition-all hover:border-teal-500 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <FaArrowLeft className="h-6 w-6 text-teal-300 transition-transform group-hover:-translate-x-1" />
        </button>

        <div className="flex gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void onNext(false);
            }}
            className="rounded-2xl border border-red-500/50 bg-red-500/10 px-8 py-4 font-bold text-red-100 transition-all hover:bg-red-500 hover:text-white"
          >
            I failed
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void onNext(true);
            }}
            className="rounded-2xl border border-teal-500/50 bg-teal-500 px-8 py-4 font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 active:scale-95"
          >
            I mastered it
          </button>
        </div>
      </div>
    </>
  );
};
