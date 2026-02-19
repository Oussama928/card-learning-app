import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { UpdateProgressRequest } from "@/types";
import { cache, cacheKeys } from "@/lib/cache";
import { handleApiError } from "@/lib/apiHandler";
import { computeNextReview, normalizeProgressState } from "@/lib/spacedRepetition";
import {
  applyXpAction,
  buildAchievementUnlockNotification,
  buildTierUnlockNotification,
  evaluateAchievements,
} from "@/lib/progressionService";
import { notifyUser } from "@/lib/notificationEvents";

interface ExistingProgressRow {
  correct_count?: number;
  incorrect_count?: number;
  repetitions?: number;
  interval_days?: number;
  ease_factor?: number;
  last_reviewed?: string | null;
  next_review_at?: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { word_id, is_learned }: UpdateProgressRequest =
      await request.json();
    const userId = await authenticateRequest(request);

    const existingResult = await db.queryAsync(
      `
      SELECT correct_count, incorrect_count, repetitions, interval_days, ease_factor, last_reviewed, next_review_at
      FROM user_progress
      WHERE user_id = $1 AND word_id = $2
      `,
      [userId, word_id]
    );

    const existing = existingResult.rows[0] as ExistingProgressRow | undefined;

    const normalized = normalizeProgressState({
      correctCount: existing?.correct_count ?? 0,
      incorrectCount: existing?.incorrect_count ?? 0,
      repetitions: existing?.repetitions ?? 0,
      intervalDays: existing?.interval_days ?? 0,
      easeFactor: existing?.ease_factor ?? 2.5,
      lastReviewedAt: existing?.last_reviewed ?? null,
      nextReviewAt: existing?.next_review_at ?? null,
    });

    const next = computeNextReview(normalized, Boolean(is_learned));

    await db.queryAsync(
      `
      INSERT INTO user_progress 
        (user_id, word_id, is_learned, correct_count, incorrect_count, repetitions, interval_days, ease_factor, last_reviewed, next_review_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, word_id) DO UPDATE
        SET is_learned = EXCLUDED.is_learned,
            correct_count = EXCLUDED.correct_count,
            incorrect_count = EXCLUDED.incorrect_count,
            repetitions = EXCLUDED.repetitions,
            interval_days = EXCLUDED.interval_days,
            ease_factor = EXCLUDED.ease_factor,
            last_reviewed = EXCLUDED.last_reviewed,
            next_review_at = EXCLUDED.next_review_at
    `,
      [
        userId,
        word_id,
        is_learned,
        next.correctCount,
        next.incorrectCount,
        next.repetitions,
        next.intervalDays,
        next.easeFactor,
        next.lastReviewedAt,
        next.nextReviewAt,
      ]
    );

    await db.queryAsync(
      `
      INSERT INTO study_activity (user_id, word_id, is_correct, reviewed_at)
      VALUES ($1, $2, $3, NOW())
      `,
      [userId, word_id, is_learned]
    );

    const progressionResult = await applyXpAction(userId, "study_review");
    const achievementResult = await evaluateAchievements(userId);

    if (progressionResult.unlockedTier) {
      const tierNotification = buildTierUnlockNotification(
        progressionResult.unlockedTier
      );
      await notifyUser(
        userId,
        tierNotification.type,
        tierNotification.content,
        tierNotification.metadata
      );
    }

    for (const badge of achievementResult.unlockedBadges) {
      const achievementNotification = buildAchievementUnlockNotification(badge);
      await notifyUser(
        userId,
        achievementNotification.type,
        achievementNotification.content,
        achievementNotification.metadata
      );
    }

    await cache.del(cacheKeys.userStats(userId));
    await cache.del(cacheKeys.globalStats);

    return NextResponse.json({
      success: true,
      message: `Word marked as ${is_learned ? "learned" : "unlearned"}`,
    });
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
