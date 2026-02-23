"use client";

import React from "react";
import { FaArrowLeft, FaMicrophone } from "react-icons/fa";
import type { StudyCardTermDTO } from "@/types";
import { SpeakButton } from "./SpeakButton";

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
            Speak the word aloud:
          </h2>
          <SpeakButton text={String(activeCard[0] ?? "")} label="Play pronunciation" />
        </div>
        <div
          className="mb-4 text-3xl font-bold text-teal-300"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {activeCard[0]}
        </div>

        {hintsEnabled ? (
          <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            Hint: {buildHint(String(activeCard[1] ?? ""))}
          </div>
        ) : null}

        {!supported ? (
          <div className="w-full rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Speech recognition is not supported in this browser.
          </div>
        ) : permissionDenied ? (
          <div className="w-full rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Microphone permission denied. Enable microphone access or use another learning mode.
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={startListening}
            disabled={!supported || permissionDenied || isListening}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaMicrophone />
            {isListening ? "Listening..." : "Start speaking"}
          </button>
          <button
            type="button"
            onClick={stopListening}
            disabled={!isListening}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
        </div>

        {transcript ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 w-full">
            You said: <span className="font-semibold text-white">{transcript}</span>
          </div>
        ) : null}

        {isCorrect !== null ? (
          <div
            role="status"
            aria-live="polite"
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold ${
              isCorrect ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"
            }`}
          >
            {isCorrect ? "Correct pronunciation!" : "Not quite. Try again."}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void onNext(Boolean(isCorrect))}
            disabled={isCorrect === null}
            className="rounded-2xl border border-teal-500/50 bg-teal-500 px-6 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit result
          </button>
          <button
            type="button"
            onClick={() => void onNext(false)}
            className="rounded-2xl border border-red-500/50 bg-red-500/10 px-6 py-3 font-bold text-red-100 transition-all hover:bg-red-500 hover:text-white"
          >
            Mark incorrect
          </button>
        </div>
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
