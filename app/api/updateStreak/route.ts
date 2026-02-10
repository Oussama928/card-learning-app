import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { ApiErrorResponseDTO, UpdateStreakResponseDTO } from "@/types";

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<UpdateStreakResponseDTO | ApiErrorResponseDTO>> {
  try {
    const userId = await authenticateRequest(request);

    const now = new Date();
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const currentStatsResult = await db.queryAsync(
      `SELECT daily_streak FROM user_stats WHERE user_id = $1`,
      [userId]
    );
    const currentStats = currentStatsResult.rows[0];

    if (!currentStats) {
      return NextResponse.json({
        success: false,
        error: "User not found.",
      });
    }

    const { daily_streak, last_login_date } = currentStats;

    let lastLoginStr: string | null;
    if (last_login_date === null) {
      lastLoginStr = null;
    } else {
      try {
        const lastLoginDate = new Date(last_login_date);
        if (isNaN(lastLoginDate.getTime())) {
          lastLoginStr = null;
        } else {
          const year = lastLoginDate.getUTCFullYear();
          const month = String(lastLoginDate.getUTCMonth() + 1).padStart(
            2,
            "0"
          );
          const day = String(lastLoginDate.getUTCDate()).padStart(2, "0");
          lastLoginStr = `${year}-${month}-${day}`;
        }
      } catch (e) {
        lastLoginStr = null;
      }
    }

    let newStreak = daily_streak;

    if (last_login_date === null) {
      newStreak = 1;
    } else if (lastLoginStr === yesterdayStr) {
      newStreak = daily_streak + 1;
    } else if (lastLoginStr !== todayStr) {
      newStreak = 1;
    }

    await db.queryAsync(
      `
      INSERT INTO user_stats (user_id, daily_streak, last_login_date)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        daily_streak = EXCLUDED.daily_streak,
        last_login_date = EXCLUDED.last_login_date
    `,
      [userId, newStreak, todayStr]
    );

    return NextResponse.json({
      success: true,
      streak: newStreak,
    });
  } catch (error: any) {
    console.error("Streak update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update daily streak" },
      { status: 500 }
    );
  }
}
