"use client";

import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import type { StudyCardTermDTO } from "@/types";
import { SpeakButton } from "./SpeakButton";

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

  const hintText = buildHint(String(activeCard?.[1] ?? ""));

  return (
    <>
      <div className="mt-6 text-center flex flex-col items-center justify-center w-full max-w-2xl rounded-xl p-8 transition-transform hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg border border-gray-600 relative">
        {studyMode === "spaced_repetition" && currentDue && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-teal-500 text-white text-xs font-bold uppercase tracking-wider animate-pulse transition-all">
            Due
          </div>
        )}
        {activeCard?.[4] ? (
          <img
            src={String(activeCard[4])}
            alt="Expression visual"
            className="w-full max-w-md h-44 object-cover rounded-xl border border-white/20 shadow-md mb-5"
          />
        ) : null}
        <div className="w-full flex items-center justify-between">
          <h2
            className="mb-4 text-2xl font-semibold text-gray-200"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            What is the translation of:
          </h2>
          <SpeakButton text={String(activeCard?.[0] ?? "")} label="Play pronunciation" />
        </div>
        <div
          className="mb-6 text-3xl font-bold text-teal-300"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {activeCard[0]}
        </div>
        {hintsEnabled && hintText ? (
          <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            Hint: {hintText}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {mcOptions.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedOption(option)}
              className={`p-3 rounded-lg border transition duration-200 ${
                selectedOption === option
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          onClick={() => void onNext(selectedOption === activeCard?.[1])}
          disabled={!selectedOption}
          className="mt-6 px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 transition duration-200 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Submit
        </button>
      </div>
      <div className="mt-4">
        <button
          onClick={onBack}
          disabled={!canGoBack || timeLimitSeconds !== null}
          className="p-3 rounded-full transition-all bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <FaArrowLeft className="h-8 w-8 text-teal-300" />
        </button>
      </div>
    </>
  );
};
