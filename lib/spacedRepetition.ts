import type { SpacedRepetitionNextReviewDTO, SpacedRepetitionStateDTO } from "@/types";

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export function normalizeProgressState(
  progress?: Partial<SpacedRepetitionStateDTO> | null
): SpacedRepetitionStateDTO {
  return {
    repetitions: Number(progress?.repetitions ?? 0),
    intervalDays: Number(progress?.intervalDays ?? 0),
    easeFactor: Number(progress?.easeFactor ?? DEFAULT_EASE_FACTOR),
    correctCount: Number(progress?.correctCount ?? 0),
    incorrectCount: Number(progress?.incorrectCount ?? 0),
    lastReviewedAt: progress?.lastReviewedAt ?? null,
    nextReviewAt: progress?.nextReviewAt ?? null,
  };
}

export function isDue(progress?: Partial<SpacedRepetitionStateDTO> | null, now = new Date()): boolean {
  if (!progress?.nextReviewAt) return true;
  const next = new Date(progress.nextReviewAt).getTime();
  return Number.isNaN(next) ? true : next <= now.getTime();
}

export function computeNextReview(
  progress: Partial<SpacedRepetitionStateDTO> | null | undefined,
  isCorrect: boolean,
  now = new Date()
): SpacedRepetitionNextReviewDTO {
  const current = normalizeProgressState(progress);
  const quality = isCorrect ? 4 : 2;

  let repetitions = current.repetitions;
  let intervalDays = current.intervalDays;
  let easeFactor = current.easeFactor;

  if (isCorrect) {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    repetitions,
    intervalDays,
    easeFactor,
    correctCount: current.correctCount + (isCorrect ? 1 : 0),
    incorrectCount: current.incorrectCount + (isCorrect ? 0 : 1),
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
    isCorrect,
  };
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function buildInitialQueue(
  total: number,
  progressMap: Record<number, SpacedRepetitionStateDTO>
): number[] {
  const now = new Date();
  const indices = Array.from({ length: total }, (_, i) => i);
  return indices.sort((a, b) => {
    const aProgress = progressMap[a];
    const bProgress = progressMap[b];
    const aDue = isDue(aProgress, now);
    const bDue = isDue(bProgress, now);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    const aNext = aProgress?.nextReviewAt ? new Date(aProgress.nextReviewAt).getTime() : 0;
    const bNext = bProgress?.nextReviewAt ? new Date(bProgress.nextReviewAt).getTime() : 0;
    return aNext - bNext;
  });
}

export function requeueCard(
  queue: number[],
  currentIndex: number,
  cardIndex: number,
  isCorrect: boolean
): number[] {
  const nextQueue = queue.filter((value, idx) => !(idx === currentIndex && value === cardIndex));
  if (isCorrect) {
    return nextQueue;
  }
  const insertionOffset = 2;
  const insertAt = Math.min(currentIndex + insertionOffset, nextQueue.length);
  nextQueue.splice(insertAt, 0, cardIndex);
  return nextQueue;
}
