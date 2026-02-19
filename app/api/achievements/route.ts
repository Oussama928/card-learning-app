import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { AppError, handleApiError, parseRequestBody } from "@/lib/apiHandler";
import { createAchievementSchema } from "@/lib/validation/schemas";
import { notifyUser } from "@/lib/notificationEvents";
import { awardNewAchievementToQualifiedUsers } from "@/lib/progressionService";
import type { ApiErrorResponseDTO, CreateAchievementResponseDTO, AchievementInsertRow } from "@/types";

const slugifyKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "achievement";

const KEY_MAX_LENGTH = 128;

async function generateAchievementKey(name: string): Promise<string> {
  const base = slugifyKey(name);
  let candidate = base;
  if (candidate.length > KEY_MAX_LENGTH) {
    candidate = candidate.slice(0, KEY_MAX_LENGTH);
  }

  let suffix = 0;
  while (true) {
    const existing = await db.queryAsync(
      `SELECT 1 FROM achievements WHERE key = $1`,
      [candidate]
    );
    if (existing.rowCount === 0) {
      return candidate;
    }

    suffix += 1;
    const suffixValue = `-${suffix}`;
    const truncatedBase = base.slice(0, KEY_MAX_LENGTH - suffixValue.length);
    candidate = `${truncatedBase}${suffixValue}`;
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateAchievementResponseDTO | ApiErrorResponseDTO>> {
  try {
    const userId = await authenticateRequest(request);
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:achievements:create",
      points: 10,
      duration: 60,
      userId,
    });

    const { name, description, conditionType, target, imageUrl, xpReward } =
      await parseRequestBody(request, createAchievementSchema);
    const key = await generateAchievementKey(name);

    const checkUserResult = await db.queryAsync(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    const userResult = checkUserResult.rows as { role?: string }[];

    if (userResult[0]?.role !== "admin") {
      throw new AppError("You are not authorized to add achievements", 401);
    }

    const insertResult = await db.queryAsync(
      `
        INSERT INTO achievements (key, name, description, image_url, condition_type, condition_value, xp_reward)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, key, name, description, image_url, condition_type, condition_value, xp_reward, created_at
      `,
      [key, name, description, imageUrl ?? null, conditionType, target, xpReward ?? 0]
    );

    const row = insertResult.rows[0] as AchievementInsertRow;

    const qualifyingUserIds = await awardNewAchievementToQualifiedUsers({
      id: row.id,
      key: row.key,
      name: row.name,
      conditionType: row.condition_type,
      conditionValue: row.condition_value,
    });

    for (const qualifyingUserId of qualifyingUserIds) {
      await notifyUser(
        qualifyingUserId,
        "achievement",
        `A new achievement badge was added and you earned it: ${row.name}`,
        {
          popupType: "achievement_unlock",
          achievementKey: row.key,
        }
      );
    }

    return NextResponse.json({
      success: true,
      achievement: {
        id: row.id,
        key: row.key,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        conditionType: row.condition_type,
        target: Number(row.condition_value),
        xpReward: Number(row.xp_reward ?? 0),
        createdAt: row.created_at,
      },
      notifiedUsers: qualifyingUserIds.length,
    });
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
