"use client";

import React from "react";
import { formatDuration } from "@/lib/spacedRepetition";
import type { SpacedRepetitionStateDTO } from "@/types";

interface SessionStatsProps {
  elapsedSeconds: number;
  isTimerRunning: boolean;
  setIsTimerRunning: (val: boolean | ((prev: boolean) => boolean)) => void;
  wantTimer: boolean;
  timeLimitSeconds: number | null;
  remainingSeconds: number | null;
  isSessionComplete: boolean;
  onEndSession: () => void;
  studyMode: string;
  currentProgress: SpacedRepetitionStateDTO | null;
  currentDue: boolean | null;
  nextReviewLabel: string;
  progressError: string | null;
}

export const SessionStats: React.FC<SessionStatsProps> = ({
  elapsedSeconds,
  isTimerRunning,
  setIsTimerRunning,
  wantTimer,
  timeLimitSeconds,
  remainingSeconds,
  isSessionComplete,
  onEndSession,
  studyMode,
  currentProgress,
  currentDue,
  nextReviewLabel,
  progressError,
}) => {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="w-full bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {wantTimer ? (
            <>
              <div>
                <div className="text-sm text-gray-300">Session Time</div>
                <div className="text-2xl font-bold text-white">
                  {formatDuration(elapsedSeconds)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className={`px-3 py-2 rounded text-sm font-semibold ${
                  isTimerRunning ? "bg-red-500/80" : "bg-teal-500"
                }`}
              >
                {isTimerRunning ? "Pause" : "Start"}
              </button>
            </>
          ) : (
            <div className="text-sm text-gray-300">
              Timer disabled for this session
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          {timeLimitSeconds && remainingSeconds !== null && !isSessionComplete ? (
            <div className="text-right">
              <div className="text-sm text-gray-300">Time left (card)</div>
              <div className="text-lg font-semibold text-amber-300">
                {formatDuration(remainingSeconds)}
              </div>
            </div>
          ) : null}
          <button
            onClick={onEndSession}
            className="px-3 py-2 rounded bg-gray-700 text-white"
          >
            End Session
          </button>
        </div>
      </div>

      {!isSessionComplete && studyMode === "spaced_repetition" && (
        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-teal-300">
                Scheduling
              </div>
              <div className="mt-1">
                Status: {currentDue ? "Due now" : "Not due"}
              </div>
              <div className="mt-1">Next review: {nextReviewLabel}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
              <div>Interval: {currentProgress?.intervalDays ?? 0} day(s)</div>
              <div>
                Ease: {currentProgress?.easeFactor?.toFixed?.(2) ?? "2.50"}
              </div>
              <div>Reps: {currentProgress?.repetitions ?? 0}</div>
              <div>Correct: {currentProgress?.correctCount ?? 0}</div>
            </div>
          </div>
          {progressError ? (
            <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {progressError}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
