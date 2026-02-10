import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch user basic info
    const userResult = await db.queryAsync(
      `SELECT id, username, email, image, country FROM users WHERE id = $1`,
      [id]
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const statsResult = await db.queryAsync(
      `SELECT total_terms_learned, accuracy, xp, daily_streak, last_login_date FROM user_stats WHERE user_id = $1`,
      [id]
    );
    const statsRow = statsResult.rows[0] || {};

    const stats = {
      username: user.username,
      email: user.email,
      image: user.image || null,
      country: user.country || null,
      totalWords: statsRow.total_terms_learned || 0,
      learnedWords: statsRow.total_terms_learned || 0,
      accuracy: statsRow.accuracy || 0,
      xp: statsRow.xp || 0,
      dailyStreak: statsRow.daily_streak || 0,
      lastLoginDate: statsRow.last_login_date || null,
    };

    return NextResponse.json({ message: "Stats retrieved successfully", stats });
  } catch (error: any) {
    console.error("getStats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats", details: error.message }, { status: 500 });
  }
}
