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
  isDue,
  normalizeProgressState,
  requeueCard,
} from "@/lib/spacedRepetition";
import { SessionSetup } from "../../components/learning/SessionSetup";
import { FlashcardMode } from "../../components/learning/FlashcardMode";
import { FillMode } from "../../components/learning/FillMode";
import { MCMode } from "../../components/learning/MCMode";
import { SessionComplete } from "../../components/learning/SessionComplete";
import { SessionStats } from "../../components/learning/SessionStats";

const Learning = () => {
  const [side, setSide] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [terms, setTerms] = React.useState<StudyCardTermDTO[]>([]);
  const [sessionHistory, setSessionHistory] = React.useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [queue, setQueue] = React.useState<number[]>([]);
  const [masteredIndices, setMasteredIndices] = React.useState<Set<number>>(new Set());
  
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
  const [studyMode, setStudyMode] = React.useState<"default" | "spaced_repetition">("default");
  const [progressError, setProgressError] = React.useState<string | null>(null);

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
        const dueOnlyParam = studyMode === "spaced_repetition" ? "&dueOnly=1" : "";
        const res = await fetch(
          `/api/getCard/${id}?user_id=${session?.user?.id}${dueOnlyParam}`,
          {
            headers: {
              authorization: session?.user?.accessToken ? `Bearer ${session.user.accessToken}` : "",
            },
          }
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
        if (initialQueue.length > 0) {
          setSessionHistory([initialQueue[0]]);
        }
        setCurrentIndex(0);
        setCorrectCount(0);
        setIncorrectCount(0);
        setElapsedSeconds(0);
        setIsTimerRunning(false);
        setMasteredIndices(new Set());
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchCardData();
  }, [id, session, studyMode]);

  React.useEffect(() => {
    if (mode === "mc" && terms.length > 0 && currentIndex < sessionHistory.length) {
      const termIndex = sessionHistory[currentIndex];
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
  }, [currentIndex, sessionHistory, terms, mode]);

  React.useEffect(() => {
    setSide(0);
  }, [currentIndex]);

  const handleStartSession = () => {
    const seconds = Number(timeLimitInput);
    if (!Number.isNaN(seconds) && seconds > 0) {
      setTimeLimitSeconds(Math.floor(seconds));
    } else {
      setTimeLimitSeconds(null);
    }

    if (wantTimer) setIsTimerRunning(true);
    setStarted(true);
    
    // Reset session states
    if (queue.length > 0) {
      setSessionHistory([queue[0]]);
    } else {
      setSessionHistory([]);
    }
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setElapsedSeconds(0);
    setCardEpoch(0);
    setMasteredIndices(new Set());
  };

  const handleEndSession = () => {
    setStarted(false);
    setIsTimerRunning(false);
    setTimeLimitSeconds(null);
    setRemainingSeconds(null);
    setCardEpoch(0);
  };

  const handleBack = () => {
    if (timeLimitSeconds !== null) return;
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
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
        void handleNext(false, true);
      }
    }, 250);

    return () => {
      if (deadlineIntervalRef.current) {
        clearInterval(deadlineIntervalRef.current);
        deadlineIntervalRef.current = null;
      }
    };
  }, [started, timeLimitSeconds, queue.length, cardEpoch]);

  const sendProgress = async (isLearned: boolean, wordId: number): Promise<boolean> => {
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
      setProgressError(null);
      return true;
    } catch (error) {
      console.error("Progress update error:", error);
      setProgressError("Failed to save progress. Please try again.");
      return false;
    }
  };

  const handleNext = async (isLearned: boolean, isAuto = false) => {
    if (currentIndex >= sessionHistory.length) return;
    
    // If navigating forward through already history
    if (currentIndex < sessionHistory.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      if (!isAuto) {
        setFillAnswer("");
        setSelectedOption("");
      }
      return;
    }

    // Otherwise, we are answering the card at sessionHistory[currentIndex] for the first time in this slot
    const termIndex = sessionHistory[currentIndex];
    const wordId = terms[termIndex]?.[2];
    if (!wordId) return;

    const saved = await sendProgress(isLearned, Number(wordId));
    if (!saved) return;
    
    if (isLearned) {
      setCorrectCount((prev) => prev + 1);
      setMasteredIndices(prev => new Set(prev).add(termIndex));
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

    // Update queue and history
    let updatedQueue: number[];
    if (studyMode === "spaced_repetition") {
        updatedQueue = requeueCard(queue, 0, termIndex, isLearned);
    } else {
        // In default mode
        updatedQueue = queue.filter((value, idx) => !(idx === 0 && value === termIndex));
        if (!isLearned) {
          updatedQueue.push(termIndex);
        }
    }
    
    setQueue(updatedQueue);
    
    if (updatedQueue.length === 0) {
      setCurrentIndex(sessionHistory.length);
      setIsTimerRunning(false);
    } else {
      const nextTermIndex = updatedQueue[0];
      setSessionHistory(prev => [...prev, nextTermIndex]);
      setCurrentIndex(prev => prev + 1);
    }

    setCardEpoch((prev) => prev + 1);

    if (!isAuto) {
      setFillAnswer("");
      setSelectedOption("");
    }
  };

  if (loading) return <Loading />;
  
  const isSessionComplete = (currentIndex >= sessionHistory.length || (started && queue.length === 0)) && started;
  const currentTermIndex = !isSessionComplete && started ? sessionHistory[currentIndex] : null;
  const activeCard = currentTermIndex !== null ? terms[currentTermIndex] : (["", "", 0, false, null] as StudyCardTermDTO);
  
  const totalCards = terms.length;
  const masteredCount = masteredIndices.size;
  const progressDenominator = totalCards;
  const progressDisplayIndex = Math.min(masteredCount, totalCards);
  
  const accuracy = (correctCount + incorrectCount) > 0 
    ? ((correctCount / (correctCount + incorrectCount)) * 100).toFixed(1) 
    : "0";
    
  const currentProgress = currentTermIndex !== null ? progressMap[currentTermIndex] : null;
  const currentDue = studyMode === "spaced_repetition" ? isDue(currentProgress ?? null) : null;
  const nextReviewLabel = currentProgress?.nextReviewAt
    ? new Date(currentProgress.nextReviewAt).toLocaleString()
    : "Not scheduled yet";

  return (
    <div
      className="flex flex-col pb-30 gap-5 min-h-screen pt-28 items-center px-4"
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

      {started && !isSessionComplete && (
        <SessionStats
          elapsedSeconds={elapsedSeconds}
          isTimerRunning={isTimerRunning}
          setIsTimerRunning={setIsTimerRunning}
          wantTimer={wantTimer}
          timeLimitSeconds={timeLimitSeconds}
          remainingSeconds={remainingSeconds}
          isSessionComplete={isSessionComplete}
          onEndSession={handleEndSession}
          studyMode={studyMode}
          currentProgress={currentProgress}
          currentDue={currentDue}
          nextReviewLabel={nextReviewLabel}
          progressError={progressError}
        />
      )}

      {started && !isSessionComplete && (
         <div className="w-full max-w-2xl px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center justify-between gap-4">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-500" 
                  style={{ width: `${(progressDisplayIndex / progressDenominator) * 100}%` }}
                />
            </div>
            <span className="text-xs font-bold text-teal-300 whitespace-nowrap">
                {progressDisplayIndex} / {progressDenominator} Card Types
            </span>
         </div>
      )}

      {!started ? (
        <SessionSetup
          mode={mode}
          setMode={setMode}
          wantTimer={wantTimer}
          setWantTimer={setWantTimer}
          timeLimitInput={timeLimitInput}
          setTimeLimitInput={setTimeLimitInput}
          onStart={handleStartSession}
        />
      ) : isSessionComplete ? (
        <SessionComplete
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          totalCards={totalCards}
          accuracy={accuracy}
        />
      ) : mode === "flashcard" ? (
        <FlashcardMode
          activeCard={activeCard}
          side={side}
          setSide={setSide}
          studyMode={studyMode}
          currentDue={currentDue}
          onNext={handleNext}
          onBack={handleBack}
          canGoBack={currentIndex > 0}
          timeLimitSeconds={timeLimitSeconds}
        />
      ) : mode === "fill" ? (
        <FillMode
          activeCard={activeCard}
          fillAnswer={fillAnswer}
          setFillAnswer={setFillAnswer}
          studyMode={studyMode}
          currentDue={currentDue}
          onNext={handleNext}
          onBack={handleBack}
          canGoBack={currentIndex > 0}
          timeLimitSeconds={timeLimitSeconds}
        />
      ) : mode === "mc" ? (
        <MCMode
          activeCard={activeCard}
          mcOptions={mcOptions}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          studyMode={studyMode}
          currentDue={currentDue}
          onNext={handleNext}
          onBack={handleBack}
          canGoBack={currentIndex > 0}
          timeLimitSeconds={timeLimitSeconds}
        />
      ) : null}
    </div>
  );
};

export default Learning;