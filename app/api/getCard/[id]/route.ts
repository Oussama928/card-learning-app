import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import type { ApiErrorResponseDTO, GetCardResponse } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetCardResponse | ApiErrorResponseDTO>> {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const dueOnly = searchParams.get("dueOnly") === "1" || searchParams.get("dueOnly") === "true";

  try {
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id query parameter is required" },
        { status: 400 }
      );
    }

    const userResult = await db.queryAsync(
      "SELECT id FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const cardResult = await db.queryAsync(
      "SELECT * FROM cards WHERE id = $1",
      [id]
    );
    const card = cardResult.rows[0];

    if (!card) {
      return NextResponse.json(
        { success: false, error: "Card not found" },
        { status: 404 }
      );
    }

    const wordsResult = await db.queryAsync(
      `
      SELECT 
        w.id,
        w.word,
        w.translated_word,
        w.image_url,
        COALESCE(up.is_learned, FALSE) as is_learned,
        COALESCE(up.correct_count, 0) AS correct_count,
        COALESCE(up.incorrect_count, 0) AS incorrect_count,
        COALESCE(up.repetitions, 0) AS repetitions,
        COALESCE(up.interval_days, 0) AS interval_days,
        COALESCE(up.ease_factor, 2.5) AS ease_factor,
        up.last_reviewed AS last_reviewed,
        up.next_review_at AS next_review_at
      FROM words w
      LEFT JOIN user_progress up 
        ON w.id = up.word_id 
        AND up.user_id = $1
      WHERE w.card_id = $2
        AND (
          $3::boolean = false
          OR up.next_review_at IS NULL
          OR up.next_review_at <= NOW()
        )
    `,
      [userId, id, dueOnly]
    );
    const words: Array<{
      id: number;
      word: string;
      translated_word: string;
      image_url: string | null;
      is_learned: boolean;
    }> = wordsResult.rows;

    const wordPairs = words.map((word) => [
      word.word,
      word.translated_word,
      word.id,
      Boolean(word.is_learned),
      word.image_url || null,
    ]);

    const progress = words.map((word) => ({
      word_id: word.id,
      is_learned: Boolean(word.is_learned),
      correct_count: Number(word.correct_count || 0),
      incorrect_count: Number(word.incorrect_count || 0),
      repetitions: Number(word.repetitions || 0),
      interval_days: Number(word.interval_days || 0),
      ease_factor: Number(word.ease_factor || 2.5),
      last_reviewed: word.last_reviewed ? String(word.last_reviewed) : null,
      next_review_at: word.next_review_at ? String(word.next_review_at) : null,
    }));

    return NextResponse.json({
      message: "Card retrieved successfully",
      id,
      cardData: wordPairs,
      progress,
      title: card.title,
      description: card.description,
      targetLanguage: card.target_language,
    } as GetCardResponse);
  } catch (error: unknown) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch card data" },
      { status: 500 }
    );
  }
}
