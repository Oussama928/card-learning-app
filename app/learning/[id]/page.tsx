"use client";

import React from "react";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import { useParams, useRouter } from "next/navigation";
import Loading from "../../components/loading";
import { useSession } from "next-auth/react";
import type {
  StudyCardProgressDTO,
  StudyCardTermDTO,
  SpacedRepetitionStateDTO,
} from "@/types";
import {
  buildInitialQueue,
  computeNextReview,
  formatDuration,
  normalizeProgressState,
  requeueCard,
} from "@/lib/spacedRepetition";

const Learning = () => {
  const [side, setSide] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [terms, setTerms] = React.useState<StudyCardTermDTO[]>([]);
  const [queue, setQueue] = React.useState<number[]>([]);
  const [queueIndex, setQueueIndex] = React.useState(0);
  const [progressMap, setProgressMap] = React.useState<Record<number, SpacedRepetitionStateDTO>>({});
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mode, setMode] = React.useState<"flashcard" | "fill" | "mc">(
    "flashcard"
  );
  const [fillAnswer, setFillAnswer] = React.useState("");
  const [mcOptions, setMcOptions] = React.useState<string[]>([]);
  const [selectedOption, setSelectedOption] = React.useState("");
  const [correctCount, setCorrectCount] = React.useState(0);
  const [incorrectCount, setIncorrectCount] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [timeLimitInput, setTimeLimitInput] = React.useState("");
  const [timeLimitSeconds, setTimeLimitSeconds] = React.useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null);
  const [started, setStarted] = React.useState(false);
  const [wantTimer, setWantTimer] = React.useState(false);
  const [cardEpoch, setCardEpoch] = React.useState(0);
  const [cardsAttempted, setCardsAttempted] = React.useState(0);
  const [studyMode, setStudyMode] = React.useState<"default" | "spaced_repetition">("default");

  const timerIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const cardStartRef = React.useRef<number>(Date.now());
  const autoAdvanceRef = React.useRef(false);

  const { data: session } = useSession();
  const { id } = useParams();
  const router = useRouter();

  React.useEffect(() => {
    const fetchStudyMode = async () => {
      try {
        const res = await fetch("/api/userPreferences", {
          headers: {
            authorization: `Bearer ${session?.user?.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setStudyMode(data.study_mode === "spaced_repetition" ? "spaced_repetition" : "default");
        }
      } catch (error) {
        console.error("Failed to fetch study mode:", error);
      }
    };

    if (session) fetchStudyMode();
  }, [session]);

  React.useEffect(() => {
    const fetchCardData = async () => {
      try {
        const res = await fetch(
          `/api/getCard/${id}?user_id=${session?.user?.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description);
        const cardTerms = (data.cardData || []) as StudyCardTermDTO[];
        const progressData = (data.progress || []) as StudyCardProgressDTO[];
        const progressByWordId = progressData.reduce<Record<number, SpacedRepetitionStateDTO>>(
          (acc, item) => {
            acc[item.word_id] = normalizeProgressState({
              repetitions: item.repetitions,
              intervalDays: item.interval_days,
              easeFactor: item.ease_factor,
              correctCount: item.correct_count,
              incorrectCount: item.incorrect_count,
              lastReviewedAt: item.last_reviewed ?? null,
              nextReviewAt: item.next_review_at ?? null,
            });
            return acc;
          },
          {}
        );
        const indexProgressMap: Record<number, SpacedRepetitionStateDTO> = {};
        cardTerms.forEach((term, termIndex) => {
          const wordId = Number(term[2]);
          if (progressByWordId[wordId]) {
            indexProgressMap[termIndex] = progressByWordId[wordId];
          }
        });
        setProgressMap(indexProgressMap);
        setTerms(cardTerms);
        
        let initialQueue: number[];
        if (studyMode === "spaced_repetition") {
          initialQueue = buildInitialQueue(cardTerms.length, indexProgressMap);
        } else {
          initialQueue = Array.from({ length: cardTerms.length }, (_, i) => i);
        }
        
        setQueue(initialQueue);
        setQueueIndex(0);
        setCorrectCount(0);
        setIncorrectCount(0);
        setElapsedSeconds(0);
        setIsTimerRunning(false);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchCardData();
  }, [id, session, studyMode]);

  // Generate options for Multiple Choice mode
  React.useEffect(() => {
    if (mode === "mc" && terms.length > 0 && queueIndex < queue.length) {
      const termIndex = queue[queueIndex];
      const correctAnswer = terms[termIndex][1];
      const allTranslations = terms
        .filter((_, i) => i !== termIndex)
        .map((term) => term[1]);
      const shuffled = allTranslations.sort(() => 0.5 - Math.random());
      const distractors = shuffled.slice(0, 3);
      const options = [...distractors, correctAnswer];
      const finalOptions = options.sort(() => 0.5 - Math.random());
      setMcOptions(finalOptions);
      setSelectedOption("");
    }
  }, [queueIndex, queue, terms, mode]);

  React.useEffect(() => {
    setSide(0);
  }, [queueIndex]);

  const handleStartSession = () => {
    const seconds = Number(timeLimitInput);
    if (!Number.isNaN(seconds) && seconds > 0) {
      setTimeLimitSeconds(Math.floor(seconds));
    } else {
      setTimeLimitSeconds(null);
    }

    if (wantTimer) setIsTimerRunning(true);
    setStarted(true);
    setQueueIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setElapsedSeconds(0);
    setCardsAttempted(0);
    setCardEpoch(0);
  };

  const handleEndSession = () => {
    setStarted(false);
    setIsTimerRunning(false);
    setTimeLimitSeconds(null);
    setRemainingSeconds(null);
    setCardsAttempted(0);
    setCardEpoch(0);
  };

  const handleBack = () => {
    if (timeLimitSeconds !== null) return;
    setQueueIndex((prev) => Math.max(prev - 1, 0));
  };

  React.useEffect(() => {
    if (!isTimerRunning) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTimerRunning]);

  React.useEffect(() => {
    if (!started || !timeLimitSeconds || queue.length === 0) {
      setRemainingSeconds(null);
      if (deadlineIntervalRef.current) {
        clearInterval(deadlineIntervalRef.current);
        deadlineIntervalRef.current = null;
      }
      return;
    }

    cardStartRef.current = Date.now();
    autoAdvanceRef.current = false;
    setRemainingSeconds(timeLimitSeconds);

    if (deadlineIntervalRef.current) {
      clearInterval(deadlineIntervalRef.current);
    }

    deadlineIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - cardStartRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(timeLimitSeconds - elapsed));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !autoAdvanceRef.current) {
        autoAdvanceRef.current = true;
        handleNext(false, true);
      }
    }, 250);

    return () => {
      if (deadlineIntervalRef.current) {
        clearInterval(deadlineIntervalRef.current);
        deadlineIntervalRef.current = null;
      }
    };
  }, [started, timeLimitSeconds, queue.length, cardEpoch]);

  const sendProgress = async (isLearned: boolean, wordId: number) => {
    try {
      const res = await fetch("/api/postProgress", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session?.user?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session?.user?.id,
          word_id: wordId,
          is_learned: isLearned,
        }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
    } catch (error) {
      console.error("Progress update error:", error);
    }
  };

  const handleNext = (isLearned: boolean, isAuto = false) => {
    if (queueIndex >= queue.length) return;
    const termIndex = queue[queueIndex];
    const wordId = terms[termIndex]?.[2];
    if (!wordId) return;

    sendProgress(isLearned, Number(wordId));
    if (isLearned) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    setProgressMap((prev) => {
      const current = prev[termIndex];
      const next = computeNextReview(current ?? null, isLearned);
      return {
        ...prev,
        [termIndex]: {
          repetitions: next.repetitions,
          intervalDays: next.intervalDays,
          easeFactor: next.easeFactor,
          correctCount: next.correctCount,
          incorrectCount: next.incorrectCount,
          lastReviewedAt: next.lastReviewedAt,
          nextReviewAt: next.nextReviewAt,
        },
      };
    });

    let updatedQueue: number[];
    if (studyMode === "spaced_repetition") {
      if (isAuto) {
        updatedQueue = queue.filter((value, idx) => !(idx === queueIndex && value === termIndex));
      } else {
        updatedQueue = requeueCard(queue, queueIndex, termIndex, isLearned);
      }
    } else {
      updatedQueue = queue.filter((value, idx) => !(idx === queueIndex && value === termIndex));
    }

    setQueue(updatedQueue);
    if (updatedQueue.length === 0) {
      setQueueIndex(0);
      // stop the timer when session completes so it doesn't keep running
      setIsTimerRunning(false);
    } else {
      const nextIndex = Math.min(queueIndex, updatedQueue.length - 1);
      setQueueIndex(nextIndex);
    }

    setCardsAttempted((prev) => prev + 1);
    setCardEpoch((prev) => prev + 1);

    if (!isAuto) {
      setFillAnswer("");
      setSelectedOption("");
    }
  };

  if (loading) return <Loading />;
  const isSessionComplete = queueIndex >= queue.length;
  const currentCard = !isSessionComplete ? terms[queue[queueIndex]] : null;
  const activeCard = currentCard ?? (["", "", 0, false, null] as StudyCardTermDTO);
  const totalCards = terms.length;
  const progressDenominator = totalCards;
  const progressDisplayIndex = totalCards === 0
    ? 0
    : isSessionComplete
    ? totalCards
    : Math.min(cardsAttempted + 1, totalCards);
  const accuracy = totalCards > 0 ? ((correctCount / totalCards) * 100).toFixed(1) : 0;

  return (
    <div
      className="flex flex-col gap-5 min-h-screen pt-28 items-center px-4"
      style={{
        background: "linear-gradient(145deg, #1e2b3a 0%, #2a3f54 100%)",
        color: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            letterSpacing: "0.5px",
            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {title}
        </h1>
        <h3
          className="text-xl opacity-80"
          style={{
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {description}
        </h3>
      </div>

      {started ? (
        <div className="w-full max-w-3xl bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {wantTimer ? (
              <>
                <div>
                  <div className="text-sm text-gray-300">Session Time</div>
                  <div className="text-2xl font-bold text-white">{formatDuration(elapsedSeconds)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((prev) => !prev)}
                  className={`px-3 py-2 rounded text-sm font-semibold ${isTimerRunning ? "bg-red-500/80" : "bg-teal-500"}`}
                >
                  {isTimerRunning ? "Pause" : "Start"}
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-300">Timer disabled for this session</div>
            )}
          </div>
          <div className="flex items-center gap-6">
            {timeLimitSeconds && remainingSeconds !== null && !isSessionComplete ? (
              <div className="text-right">
                <div className="text-sm text-gray-300">Time left (card)</div>
                <div className="text-lg font-semibold text-amber-300">{formatDuration(remainingSeconds)}</div>
              </div>
            ) : null}
            <button onClick={handleEndSession} className="px-3 py-2 rounded bg-gray-700 text-white">End Session</button>
          </div>
        </div>
      ) : null}

      {!started ? (
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
                    onClick={() => setWantTimer((prev) => !prev)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      wantTimer ? "bg-teal-500 text-white" : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {wantTimer ? "Timer On" : "Timer Off"}
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Card Deadline</p>
                  <input
                    type="number"
                    min={1}
                    value={timeLimitInput}
                    onChange={(e) => setTimeLimitInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-teal-400 focus:outline-none"
                    placeholder="Seconds (optional)"
                  />
                  <p className="text-xs text-gray-400">
                    When set, the card will auto-advance and you cannot go back to it.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleStartSession}
                className="flex-1 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-teal-500/40 transition hover:from-teal-400 hover:to-cyan-400"
              >
                Start Session
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeLimitInput("");
                  setWantTimer(false);
                  setMode("flashcard");
                }}
                className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/50"
              >
                Reset
              </button>
            </div>
          </div>
        </section>
      ) : isSessionComplete ? (
        <div
          className="text-center flex flex-col items-center gap-6 p-8 rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg border border-gray-600 max-w-md"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <h2 className="text-3xl font-bold text-teal-300"> Congratulations!</h2>
          <p className="text-xl text-gray-200">You've completed the set!</p>
          
          <div className="w-full space-y-4 mt-4">
            <div className="flex justify-between items-center p-4 bg-gray-900 rounded-lg">
              <span className="text-lg text-gray-300">Total Cards:</span>
              <span className="text-2xl font-bold text-white">{totalCards}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-green-900/30 rounded-lg border border-green-500/30">
              <span className="text-lg text-gray-300">Correct:</span>
              <span className="text-2xl font-bold text-green-400"> {correctCount}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-red-900/30 rounded-lg border border-red-500/30">
              <span className="text-lg text-gray-300">Incorrect:</span>
              <span className="text-2xl font-bold text-red-400"> {incorrectCount}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
              <span className="text-lg text-gray-300">Accuracy:</span>
              <span className="text-2xl font-bold text-blue-400">{accuracy}%</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-6 flex items-center gap-3 px-8 py-4 rounded-lg bg-teal-500 hover:bg-teal-600 transition duration-200 text-white font-semibold shadow-md text-lg"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FaHome className="text-xl" />
            Go to Home
          </button>
        </div>
      ) : mode === "flashcard" ? (
        <>
          {currentCard?.[4] ? (
            <img
              src={String(activeCard[4])}
              alt="Expression visual"
              className="w-full max-w-md h-48 object-cover rounded-xl border border-white/20 shadow-md"
            />
          ) : null}
          <div
            onClick={() => setSide((prev) => (prev === 0 ? 1 : 0))}
            className="cursor-pointer mt-6 text-center flex justify-center items-center text-3xl w-full max-w-2xl rounded-xl transition-transform hover:scale-105"
            style={{
              background:
                "linear-gradient(145deg, rgba(42,63,84,0.9) 0%, rgba(30,43,58,0.9) 100%)",
              minHeight: "300px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              border: "1px solid rgba(127,202,201,0.1)",
              padding: "2rem",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <span
              style={{
                color: activeCard[side] ? "#7fcac9" : "rgba(255,255,255,0.5)",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {activeCard[side] || "No term found"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12">
            <button
              onClick={() => handleNext(false)}
              disabled={isSessionComplete}
              className="p-4 rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <span className="text-red-500 text-lg font-semibold">
                Dunno 🔴
              </span>
            </button>

            <span
              className="text-xl font-medium text-white/80"
              style={{
                minWidth: "100px",
                textAlign: "center",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {progressDisplayIndex} / {progressDenominator || 0}
            </span>

            <button
              onClick={() => handleNext(true)}
              disabled={isSessionComplete}
              className="p-4 rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <span className="text-green-500 text-lg font-semibold">
                Know ✅
              </span>
            </button>
          </div>
          <div>
            <button
              onClick={handleBack}
              disabled={queueIndex === 0 || timeLimitSeconds !== null}
              className="p-3 rounded-full transition-all"
              style={{
                background: "rgba(127,202,201,0.1)",
                opacity: queueIndex === 0 || timeLimitSeconds !== null ? 0.5 : 1,
                cursor: queueIndex === 0 || timeLimitSeconds !== null ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <FaArrowLeft className="h-8 w-8" style={{ color: "#7fcac9" }} />
            </button>
          </div>
        </>
      ) : mode === "fill" ? (
        <>
          <div className="mt-6 text-center flex flex-col items-center justify-center w-full max-w-2xl rounded-xl p-8 transition-transform hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg border border-gray-600">
            {currentCard?.[4] ? (
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
                handleNext(
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
              onClick={handleBack}
              disabled={queueIndex === 0 || timeLimitSeconds !== null}
              className="p-3 rounded-full transition-all bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <FaArrowLeft className="h-8 w-8 text-teal-300" />
            </button>
          </div>
        </>
      ) : mode === "mc" ? (
        <>
          <div className="mt-6 text-center flex flex-col items-center justify-center w-full max-w-2xl rounded-xl p-8 transition-transform hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg border border-gray-600">
            {currentCard?.[4] ? (
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
              What is the translation of:
            </h2>
            <div
              className="mb-6 text-3xl font-bold text-teal-300"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {activeCard[0]}
            </div>
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
              onClick={() => handleNext(selectedOption === activeCard?.[1])}
              disabled={!selectedOption}
              className="mt-6 px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 transition duration-200 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Submit
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={handleBack}
              disabled={queueIndex === 0 || timeLimitSeconds !== null}
              className="p-3 rounded-full transition-all bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <FaArrowLeft className="h-8 w-8 text-teal-300" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Learning;