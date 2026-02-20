"use client";

import React from "react";
import { FaHome } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface SessionCompleteProps {
  correctCount: number;
  incorrectCount: number;
  totalCards: number;
  accuracy: string | number;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  correctCount,
  incorrectCount,
  totalCards,
  accuracy,
}) => {
  const router = useRouter();

  return (
    <div className="mt-8 flex w-full max-w-4xl flex-col items-center justify-center space-y-10 rounded-[40px] bg-gray-800/80 p-16 shadow-2xl backdrop-blur-xl border border-white/10">
      <div className="text-center">
        <div className="mb-4 inline-block rounded-full bg-teal-500/20 px-6 py-2 text-sm font-bold tracking-widest text-teal-300 uppercase">
          Session Complete
        </div>
        <h2
          className="text-6xl font-black text-white"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Excellent Work!
        </h2>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center transition-transform hover:scale-105">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">Mastered</p>
          <p className="mt-2 text-5xl font-black text-teal-400">{correctCount}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center transition-transform hover:scale-105">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">Still Learning</p>
          <p className="mt-2 text-5xl font-black text-amber-400">{incorrectCount}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center transition-transform hover:scale-105">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">Accuracy</p>
          <p className="mt-2 text-5xl font-black text-white">{accuracy}%</p>
        </div>
      </div>

      <div className="flex gap-6 pt-4">
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl border border-white/10 bg-white/5 px-10 py-4 font-bold text-white transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
        >
          Study Again
        </button>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 rounded-2xl bg-teal-500 px-10 py-4 font-bold text-white shadow-lg transition-all hover:bg-teal-600 hover:scale-105 hover:shadow-teal-500/20 active:scale-95"
        >
          <FaHome /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};
