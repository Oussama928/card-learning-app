import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { authenticateRequest } from "../authenticateRequest";

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);

    const [cardsResult, progressResult, favoritesResult] = await Promise.all([
      db.queryAsync("SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at DESC", [userId]),
      db.queryAsync(
        `SELECT up.*, w.word, w.translated_word, w.card_id
         FROM user_progress up
         LEFT JOIN words w ON up.word_id = w.id
         WHERE up.user_id = $1
         ORDER BY up.updated_at DESC NULLS LAST`,
        [userId]
      ),
      db.queryAsync("SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC", [userId]),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      userId,
      cards: cardsResult.rows,
      progress: progressResult.rows,
      favorites: favoritesResult.rows,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    return NextResponse.json(
      { error: "Failed to export user data", details: err.message },
      { status: err.status || 500 }
    );
  }
}
