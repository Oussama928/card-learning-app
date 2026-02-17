import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import type { HomeOverviewDTO, HomeStudySessionDTO } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);

    const sessionResult = await db.queryAsync(
      `
      WITH card_progress AS (
        SELECT
          c.id,
          c.title,
          c.description,
          c.target_language,
          COUNT(w.id)::int AS total_words,
          SUM(CASE WHEN COALESCE(up.is_learned, FALSE) THEN 1 ELSE 0 END)::int AS learned_words,
          MAX(sa.reviewed_at) AS last_reviewed_at
        FROM cards c
        INNER JOIN words w ON w.card_id = c.id
        LEFT JOIN user_progress up
          ON up.word_id = w.id
          AND up.user_id = $1
        LEFT JOIN study_activity sa
          ON sa.word_id = w.id
          AND sa.user_id = $1
        GROUP BY c.id, c.title, c.description, c.target_language
      )
      SELECT
        id,
        title,
        description,
        target_language,
        total_words,
        learned_words,
        last_reviewed_at,
        CASE
          WHEN learned_words > 0 AND learned_words < total_words THEN 'unfinished'
          WHEN learned_words = total_words AND total_words > 0 THEN 'completed'
          ELSE 'other'
        END AS status
      FROM card_progress
      WHERE last_reviewed_at IS NOT NULL
      ORDER BY last_reviewed_at DESC, id DESC
      `,
      [userId]
    );

    const asCard = (row: Record<string, unknown>): HomeStudySessionDTO => ({
      id: Number(row.id),
      title: String(row.title || ""),
      description: row.description ? String(row.description) : null,
      targetLanguage: String(row.target_language || ""),
      totalWords: Number(row.total_words || 0),
      learnedWords: Number(row.learned_words || 0),
      lastReviewedAt: String(row.last_reviewed_at || ""),
    });

    const unfinishedSessions = sessionResult.rows
      .filter((row: Record<string, unknown>) => row.status === "unfinished")
      .slice(0, 4)
      .map(asCard);

    const completedSessions = sessionResult.rows
      .filter((row: Record<string, unknown>) => row.status === "completed")
      .slice(0, 4)
      .map(asCard);

    const overview: HomeOverviewDTO = {
      mode: unfinishedSessions.length > 0 ? "continue" : completedSessions.length > 0 ? "retry" : "empty",
      unfinishedSessions,
      completedSessions,
    };

    return NextResponse.json({
      message: "Home overview loaded",
      overview,
    });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    return NextResponse.json(
      { error: "Failed to load home overview" },
      { status: 500 }
    );
  }
}
