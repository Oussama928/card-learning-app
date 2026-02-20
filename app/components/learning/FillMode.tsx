"use client";

import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import type { StudyCardTermDTO } from "@/types";

interface FillModeProps {
  activeCard: StudyCardTermDTO;
  fillAnswer: string;
  setFillAnswer: (val: string) => void;
  studyMode: string;
  currentDue: boolean | null;
  onNext: (isLearned: boolean) => Promise<void>;
  onBack: () => void;
  canGoBack: boolean;
  timeLimitSeconds: number | null;
}

export const FillMode: React.FC<FillModeProps> = ({
  activeCard,
  fillAnswer,
  setFillAnswer,
  studyMode,
  currentDue,
  onNext,
  onBack,
  canGoBack,
  timeLimitSeconds,
}) => {
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
        <h2
          className="mb-4 text-2xl font-semibold text-gray-200"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Translate the following:
        </h2>
        <div
          className="mb-6 text-3xl font-bold text-teal-300"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {activeCard[0]}
        </div>
        <input
          type="text"
          value={fillAnswer}
          onChange={(e) => setFillAnswer(e.target.value)}
          placeholder="Your translation"
          className="p-3 w-full max-w-md rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 text-black"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        />
        <button
          onClick={() =>
            void onNext(
              fillAnswer.trim().toLowerCase() ===
                String(activeCard?.[1] ?? "").toLowerCase()
            )
          }
          className="mt-6 px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 transition duration-200 text-white font-medium shadow-md"
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
