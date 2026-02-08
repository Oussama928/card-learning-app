import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(request, { params }) {
  const { id: userId } = await params;

  try {
    const userExistsResult = await db.queryAsync(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    );
    if (userExistsResult.rowCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const progressResult = await db.queryAsync(
      `
      SELECT 
        COUNT(*) AS total_terms,
        SUM(CASE WHEN is_learned THEN 1 ELSE 0 END) AS learned_terms
      FROM user_progress
      WHERE user_id = $1
    `,
      [userId]
    );
    const progressData = progressResult.rows[0] || {};

    const totalTermsLearned = progressData.learned_terms || 0;
    const accuracy =
      progressData.total_terms > 0
        ? (totalTermsLearned / progressData.total_terms) * 100
        : 0;
    const xp = totalTermsLearned * 17;

    await db.queryAsync(
      `
      INSERT INTO user_stats (
        user_id, 
        total_terms_learned, 
        accuracy, 
        xp
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        total_terms_learned = EXCLUDED.total_terms_learned,
        accuracy = EXCLUDED.accuracy,
        xp = EXCLUDED.xp
    `,
      [userId, totalTermsLearned, accuracy, xp]
    );

    const userStatsResult = await db.queryAsync(
      `SELECT daily_streak FROM user_stats WHERE user_id = $1`,
      [userId]
    );
    const userStats = userStatsResult.rows[0] || { daily_streak: 0 };

    const countryBioResult = await db.queryAsync(
      `SELECT country, bio, username, email FROM users WHERE id = $1`,
      [userId]
    );
    const countryBio = countryBioResult.rows[0] || { country: "", bio: "", username: "", email: "" };

    return NextResponse.json({
      success: true,
      stats: {
        dailyStreak: userStats.daily_streak,
        totalTermsLearned,
        accuracy: Number(accuracy.toFixed(2)),
        xp,
        country: countryBio.country,
        bio: countryBio.bio,
        username: countryBio.username,
        email: countryBio.email,
      },
    });
  } catch (error) {
    console.error("Stats fetch/update error:", error);
    return NextResponse.json(
      { error: "Failed to process user stats" },
      { status: 500 }
    );
  }
}
