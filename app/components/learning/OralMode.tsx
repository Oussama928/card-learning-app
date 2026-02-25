"use client";

import React from "react";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import type { StudyCardTermDTO } from "@/types";
import { SpeakButton } from "./SpeakButton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface OralModeProps {
  activeCard: StudyCardTermDTO;
  studyMode: string;
  currentDue: boolean | null;
  onNext: (isLearned: boolean) => Promise<void>;
  onBack: () => void;
  canGoBack: boolean;
  timeLimitSeconds: number | null;
  hintsEnabled: boolean;
}

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T }
  ? T
  : typeof window extends { webkitSpeechRecognition: infer U }
  ? U
  : null;

type SpeechRecognitionResultLike = { transcript: string };
type SpeechRecognitionEventLike = { results?: ArrayLike<ArrayLike<SpeechRecognitionResultLike>> };
type SpeechRecognitionErrorEventLike = { error?: string };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

// preparing the speech string
const normalizeSpeech = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s']/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const buildHint = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 2) return trimmed[0] ? `${trimmed[0]}…` : trimmed;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  return `${first}${"•".repeat(Math.max(trimmed.length - 2, 1))}${last}`;
};

export const OralMode: React.FC<OralModeProps> = ({
  activeCard,
  studyMode,
  currentDue,
  onNext,
  onBack,
  canGoBack,
  timeLimitSeconds,
  hintsEnabled,
}) => {
  const [supported, setSupported] = React.useState(true);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  const recognitionRef = React.useRef<SpeechRecognitionType | null>(null);

  React.useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionType })
        ?.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType })
        ?.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new (SpeechRecognitionCtor as unknown as SpeechRecognitionConstructor)();
    recognition.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const result = event.results?.[0]?.[0]?.transcript ?? "";
      setTranscript(result);
      const expected = normalizeSpeech(String(activeCard[0] ?? ""));
      const received = normalizeSpeech(result);
      setIsCorrect(Boolean(expected) && expected === received);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setPermissionDenied(true);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop?.();
    };
  }, [activeCard]);

  const startListening = () => {
    setTranscript("");
    setIsCorrect(null);
    setPermissionDenied(false);
    setIsListening(true);
    recognitionRef.current?.start?.();
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  };

  return (
    <>
      <Card className="w-full max-w-2xl relative">
        {studyMode === "spaced_repetition" && currentDue && (
          <div className="absolute top-4 right-4">
            <Badge variant="default" className="animate-pulse">
              Due
            </Badge>
          </div>
        )}
        
        <CardHeader className="flex flex-row items-center justify-between pb-2">
           <CardTitle className="text-2xl font-semibold">
            Speak the word aloud:
          </CardTitle>
          <SpeakButton text={String(activeCard[0] ?? "")} label="Play pronunciation" />
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-6">
          {activeCard?.[4] ? (
            <img
              src={String(activeCard[4])}
              alt="Expression visual"
              className="w-full max-w-md h-44 object-cover rounded-xl border shadow-md"
            />
          ) : null}
          
          <div className="text-3xl font-bold text-primary">
            {activeCard[0]}
          </div>

          {hintsEnabled && (
            <div className="w-full rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
              Hint: {buildHint(String(activeCard[1] ?? ""))}
            </div>
          )}

          {!supported && (
            <div className="w-full rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Speech recognition is not supported in this browser.
            </div>
          )}
          
          {permissionDenied && (
             <div className="w-full rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Microphone permission denied. Enable microphone access or use another learning mode.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={startListening}
              disabled={!supported || permissionDenied || isListening}
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              {isListening ? "Listening..." : "Start speaking"}
            </Button>
            
            <Button
              variant="outline"
              onClick={stopListening}
              disabled={!isListening}
            >
              <MicOff className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>

          {transcript && (
            <div className="w-full rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              You said: <span className="font-semibold text-foreground">{transcript}</span>
            </div>
          )}

          {isCorrect !== null && (
            <div
              role="status"
              aria-live="polite"
              className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-center ${
                isCorrect 
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                  : "bg-destructive/20 text-destructive dark:text-red-400"
              }`}
            >
              {isCorrect ? "Correct pronunciation!" : "Not quite. Try again."}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-center gap-3 pt-2 pb-6">
          <Button
            onClick={() => void onNext(Boolean(isCorrect))}
            disabled={isCorrect === null}
            className="w-full sm:w-auto"
            size="lg"
          >
            Submit result
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onNext(false)}
            className="w-full sm:w-auto"
             size="lg"
          >
            Mark incorrect
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-4">
        <Button
          variant="secondary"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack || timeLimitSeconds !== null}
          className="rounded-full shadow-md w-12 h-12"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
};
