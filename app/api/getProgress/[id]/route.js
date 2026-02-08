import { NextResponse } from 'next/server';
import db from '../../../../lib/db';
//add auth to this later not needed for now as i dont use the api itself
export async function GET(request, { params }) {
  const { id: cardId } = params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  try {
    const userResult = await db.queryAsync(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const wordsResult = await db.queryAsync(`
      SELECT w.id, w.word, w.translated_word,
             COALESCE(up.is_learned, FALSE) AS is_learned
      FROM words w
      LEFT JOIN user_progress up 
        ON w.id = up.word_id AND up.user_id = $1
      WHERE w.card_id = $2
    `, [user.id, cardId]);
    const words = wordsResult.rows;

    return NextResponse.json({
      message: 'Progress retrieved successfully',
      progress: words.map(word => ({
        word_id: word.id,
        original: word.word,
        translation: word.translated_word,
        is_learned: Boolean(word.is_learned)
      }))
    });

  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load progress" },
      { status: 500 }
    );
  }
}