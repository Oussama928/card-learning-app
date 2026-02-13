import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import { cache, cacheKeys } from "@/lib/cache";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:user-stats",
      points: 60,
      duration: 60,
      userId: id,
    });

    const cached = await cache.getJSON<{ message: string; stats: any }>(
      cacheKeys.userStats(id)
    );
    if (cached) {
      return NextResponse.json(cached);
    }

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

    const response = { message: "Stats retrieved successfully", stats };

    await cache.setJSON(cacheKeys.userStats(id), response, 60);

    return NextResponse.json(response);
  } catch (error: any) {
    return handleApiError(error, request);
  }
}
