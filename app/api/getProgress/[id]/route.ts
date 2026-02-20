import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import type { GetProgressResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: cardId } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const dueOnly = searchParams.get("dueOnly") === "1" || searchParams.get("dueOnly") === "true";

  try {
    const userResult = await db.queryAsync(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const wordsResult = await db.queryAsync(
      `
      SELECT w.id, w.word, w.translated_word,
             COALESCE(up.is_learned, FALSE) AS is_learned,
             COALESCE(up.correct_count, 0) AS correct_count,
             COALESCE(up.incorrect_count, 0) AS incorrect_count,
             COALESCE(up.repetitions, 0) AS repetitions,
             COALESCE(up.interval_days, 0) AS interval_days,
             COALESCE(up.ease_factor, 2.5) AS ease_factor,
             up.last_reviewed AS last_reviewed,
             up.next_review_at AS next_review_at
      FROM words w
      LEFT JOIN user_progress up 
        ON w.id = up.word_id AND up.user_id = $1
      WHERE w.card_id = $2
        AND (
          $3::boolean = false
          OR up.next_review_at IS NULL
          OR up.next_review_at <= NOW()
        )
    `,
      [user.id, cardId, dueOnly]
    );
    const words = wordsResult.rows;

    interface RawProgressRow {
      id: number;
      word: string;
      translated_word: string;
      is_learned: boolean;
      correct_count: number;
      incorrect_count: number;
      repetitions: number;
      interval_days: number;
      ease_factor: number;
      last_reviewed: Date | string | null;
      next_review_at: Date | string | null;
    }

    return NextResponse.json({
      message: "Progress retrieved successfully",
      progress: (words as RawProgressRow[]).map((word) => ({
        word_id: word.id,
        original: word.word,
        translation: word.translated_word,
        is_learned: Boolean(word.is_learned),
        correct_count: Number(word.correct_count || 0),
        incorrect_count: Number(word.incorrect_count || 0),
        repetitions: Number(word.repetitions || 0),
        interval_days: Number(word.interval_days || 0),
        ease_factor: Number(word.ease_factor || 2.5),
        lastReviewed: word.last_reviewed ? String(word.last_reviewed) : null,
        nextReviewAt: word.next_review_at ? String(word.next_review_at) : null,
      })),
    } as GetProgressResponse);
  } catch (error: unknown) {
    console.error("Progress fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load progress" },
      { status: 500 }
    );
  }
}
