import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import { cache, cacheKeys } from "@/lib/cache";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";
import { evaluateAchievements, getTierProgressSummary } from "@/lib/progressionService";
import type { GetStatsResponseDTO } from "@/types";

interface UserRow {
  id: number;
  username: string;
  email: string;
  image?: string | null;
  country?: string | null;
  bio?: string | null;
}

interface UserStatsRow {
  total_terms_learned?: number;
  accuracy?: number;
  xp?: number;
  daily_streak?: number;
  last_login_date?: string | null;
}

interface ActivityRow {
  day: string;
  reviews: number;
  correct_reviews: number;
}

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

    const cached = await cache.getJSON<GetStatsResponseDTO & { message: string }>(
      cacheKeys.userStats(id)
    );
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch user basic info
    const userResult = await db.queryAsync(
      `SELECT id, username, email, image, country, bio FROM users WHERE id = $1`,
      [id]
    );
    const user = userResult.rows[0] as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const statsResult = await db.queryAsync(
      `SELECT total_terms_learned, accuracy, xp, daily_streak, last_login_date FROM user_stats WHERE user_id = $1`,
      [id]
    );
    const statsRow = (statsResult.rows[0] || {}) as UserStatsRow;

    const activityResult = await db.queryAsync(
      `
      SELECT 
        DATE(reviewed_at) AS day,
        COUNT(*)::int AS reviews,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct_reviews
      FROM study_activity
      WHERE user_id = $1
        AND reviewed_at >= NOW() - INTERVAL '180 days'
      GROUP BY DATE(reviewed_at)
      ORDER BY day ASC
      `,
      [id]
    );

    const tierProgress = await getTierProgressSummary(Number(id));
    const achievementResult = await evaluateAchievements(Number(id));

    const stats = {
      username: user.username,
      email: user.email,
      image: user.image || null,
      country: user.country || null,
      bio: user.bio || null,
      totalTermsLearned: statsRow.total_terms_learned || 0,
      totalWords: statsRow.total_terms_learned || 0,
      learnedWords: statsRow.total_terms_learned || 0,
      accuracy: statsRow.accuracy || 0,
      xp: statsRow.xp || 0,
      dailyStreak: statsRow.daily_streak || 0,
      lastLoginDate: statsRow.last_login_date || null,
      activityHeatmap: (activityResult.rows as ActivityRow[]).map((row) => ({
        date: row.day,
        reviews: row.reviews || 0,
        correctReviews: row.correct_reviews || 0,
      })),
      progression: tierProgress,
      achievements: achievementResult.badges,
    };

    const response: GetStatsResponseDTO & { message: string } = {
      message: "Stats retrieved successfully",
      stats,
    };

    await cache.setJSON(cacheKeys.userStats(id), response, 60);

    return NextResponse.json(response);
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
