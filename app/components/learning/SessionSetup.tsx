"use client";

import React from "react";

interface SessionSetupProps {
  mode: "flashcard" | "fill" | "mc";
  setMode: (mode: "flashcard" | "fill" | "mc") => void;
  wantTimer: boolean;
  setWantTimer: (val: boolean) => void;
  timeLimitInput: string;
  setTimeLimitInput: (val: string) => void;
  onStart: () => void;
}

export const SessionSetup: React.FC<SessionSetupProps> = ({
  mode,
  setMode,
  wantTimer,
  setWantTimer,
  timeLimitInput,
  setTimeLimitInput,
  onStart,
}) => {
  return (
    <section className="w-full max-w-3xl">
      <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-[#102332]/80 to-[#1f2f3e]/80 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.65)]">
        <div className="space-y-1 border-b border-white/10 pb-4">
          <p className="text-xs uppercase tracking-[0.4em] text-teal-300">Session Setup</p>
          <p className="text-2xl font-semibold text-white">Plan your study moment</p>
          <p className="text-sm text-gray-300">Pick a learning type, toggle the timer, and optionally add a card deadline.</p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Learning Type</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <button
                onClick={() => setMode("flashcard")}
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                  mode === "flashcard"
                    ? "border-teal-400 bg-teal-500 text-white"
                    : "border-white/20 bg-transparent text-gray-300 hover:border-white/60"
                }`}
              >
                Flashcards
              </button>
              <button
                onClick={() => setMode("fill")}
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                  mode === "fill"
                    ? "border-teal-400 bg-teal-500 text-white"
                    : "border-white/20 bg-transparent text-gray-300 hover:border-white/60"
                }`}
              >
                Fill
              </button>
              <button
                onClick={() => setMode("mc")}
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                  mode === "mc"
                    ? "border-teal-400 bg-teal-500 text-white"
                    : "border-white/20 bg-transparent text-gray-300 hover:border-white/60"
                }`}
              >
                Multiple Choice
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Session Timer</p>
                <p className="text-sm text-gray-300">Track how long you study.</p>
              </div>
              <button
                type="button"
                onClick={() => setWantTimer(!wantTimer)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  wantTimer ? "bg-teal-500 text-white" : "bg-white/10 text-gray-300"
                }`}
              >
                {wantTimer ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Card Deadline (optional)</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Seconds (e.g. 10)"
                  value={timeLimitInput}
                  onChange={(e) => setTimeLimitInput(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-teal-500 focus:outline-none"
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">sec / card</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-teal-500/20 active:scale-[0.98]"
        >
          Begin Study Session
        </button>
      </div>
    </section>
  );
};
