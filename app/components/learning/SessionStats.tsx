"use client";

import React from "react";
import { formatDuration } from "@/lib/spacedRepetition";
import type { SpacedRepetitionStateDTO } from "@/types";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Play, Pause, Timer, TimerOff } from "lucide-react";

interface SessionStatsProps {
  elapsedSeconds: number;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
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
  hintsEnabled: boolean;
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
  hintsEnabled,
}) => {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {wantTimer ? (
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Timer className="h-3 w-3" /> Session Time
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {formatDuration(elapsedSeconds)}
                  </div>
                </div>
                <Button
                  variant={isTimerRunning ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsTimerRunning((prev) => !prev)}
                >
                  {isTimerRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                  {isTimerRunning ? "Pause" : "Start"}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <TimerOff className="h-4 w-4" />
                Timer disabled
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 ml-auto">
            {hintsEnabled && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">
                Hints on (-50% XP)
              </Badge>
            )}
            
            {timeLimitSeconds && remainingSeconds !== null && !isSessionComplete && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Time left</div>
                <div className="text-lg font-bold tabular-nums text-amber-500">
                  {formatDuration(remainingSeconds)}
                </div>
              </div>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              onClick={onEndSession}
            >
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isSessionComplete && studyMode === "spaced_repetition" && (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Scheduling
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={currentDue ? "default" : "secondary"}>
                    {currentDue ? "Due now" : "Not due"}
                  </Badge>
                </div>
                <div className="mt-1 text-muted-foreground">
                  Next review: <span className="text-foreground font-medium">{nextReviewLabel}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span>Interval:</span>
                  <span className="font-medium text-foreground">{currentProgress?.intervalDays ?? 0}d</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Ease:</span>
                  <span className="font-medium text-foreground">{currentProgress?.easeFactor?.toFixed?.(2) ?? "2.50"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Reps:</span>
                  <span className="font-medium text-foreground">{currentProgress?.repetitions ?? 0}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Correct:</span>
                  <span className="font-medium text-foreground">{currentProgress?.correctCount ?? 0}</span>
                </div>
              </div>
            </div>
            
            {progressError && (
              <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium border border-destructive/20">
                {progressError}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
