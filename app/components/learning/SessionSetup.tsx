"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Play } from "lucide-react";

interface SessionSetupProps {
  mode: "flashcard" | "fill" | "mc" | "oral";
  setMode: (mode: "flashcard" | "fill" | "mc" | "oral") => void;
  wantTimer: boolean;
  setWantTimer: (val: boolean) => void;
  timeLimitInput: string;
  setTimeLimitInput: (val: string) => void;
  onStart: () => void;
  hintsEnabled: boolean;
  setHintsEnabled: (val: boolean) => void;
}

export const SessionSetup: React.FC<SessionSetupProps> = ({
  mode,
  setMode,
  wantTimer,
  setWantTimer,
  timeLimitInput,
  setTimeLimitInput,
  onStart,
  hintsEnabled,
  setHintsEnabled,
}) => {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="border-b space-y-4 pb-6">
        <div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-primary border-primary/20">SESSION SETUP</Badge>
          </div>
          <CardTitle className="mt-4 text-2xl">Plan your study moment</CardTitle>
          <CardDescription className="text-base mt-2">
            Pick a learning type, toggle the timer, and optionally add a card deadline.
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="grid gap-6 p-6 md:grid-cols-2">
        {/* Learning Type Section */}
        <Card className="border bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Learning Type</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(["flashcard", "fill", "mc", "oral"] as const).map((m) => (
              <Button
                key={m}
                onClick={() => setMode(m)}
                variant={mode === m ? "default" : "outline"}
                className={`w-full capitalize ${mode !== m && "bg-transparent hover:bg-muted"}`}
              >
                {m === "mc" ? "Multiple Choice" : m}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Timer Section */}
        <Card className="border bg-muted/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Session Timer</CardTitle>
            <Button
              type="button"
              variant={wantTimer ? "default" : "secondary"}
              size="sm"
              onClick={() => setWantTimer(!wantTimer)}
              className="h-7 text-xs"
            >
              {wantTimer ? "Enabled" : "Disabled"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground mb-4">Track how long you study.</p>
          </CardContent>
        </Card>

        {/* Card Deadline Section */}
        <Card className="border bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Card Deadline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground">Time limit per card (seconds)</p>
            <Input
              type="number"
              placeholder="e.g. 10 (Leave empty for no limit)"
              value={timeLimitInput}
              onChange={(e) => setTimeLimitInput(e.target.value)}
              className="bg-background"
            />
          </CardContent>
        </Card>

        {/* Hints Section */}
        <Card className="border bg-muted/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Hints</CardTitle>
             <Button
              type="button"
              variant={hintsEnabled ? "default" : "secondary"}
              size="sm"
              onClick={() => setHintsEnabled(!hintsEnabled)}
              className="h-7 text-xs"
            >
              {hintsEnabled ? "Enabled" : "Disabled"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground mb-2">
              Show first letter of answer if stuck.
            </p>
             {hintsEnabled && (
                <div className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600 border border-amber-500/20">
                  Hints are on — XP rewards will be reduced by 50% for this session.
                </div>
            )}
          </CardContent>
        </Card>
      </CardContent>

      <div className="p-6 pt-0">
        <Button 
          onClick={onStart} 
          className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Start Session
        </Button>
      </div>
    </Card>
  );
};
