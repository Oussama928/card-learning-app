import db from "@/lib/db";
import type {
  AchievementBadgeDTO,
  AchievementConditionTypeDTO,
  NotificationMetadataDTO,
  TierDefinitionDTO,
  TierNameDTO,
  UserTierProgressDTO,
} from "@/types";

interface UserStatsProgressRow {
  xp: number;
  current_tier: TierNameDTO;
}

interface TierPercentileRow {
  xp: number;
  percentile: number;
}

interface AchievementRow {
  id: number;
  key: string;
  name: string;
  description: string;
  image_url: string | null;
  condition_type: AchievementConditionTypeDTO;
  condition_value: number;
  unlocked_at: string | null;
}

interface CountRow {
  total: string | number;
}

interface ProgressionActionResult {
  xpAwarded: number;
  newXp: number;
  previousTier: TierNameDTO;
  currentTier: TierNameDTO;
  unlockedTier: TierDefinitionDTO | null;
}

interface AchievementUnlockResult {
  unlockedBadges: AchievementBadgeDTO[];
  badges: AchievementBadgeDTO[];
}

interface NewAchievementInput {
  id: number;
  key: string;
  name: string;
  conditionType: AchievementConditionTypeDTO;
  conditionValue: number;
}

interface TierUnlockNotificationPayload {
  type: "tier";
  content: string;
  metadata: NotificationMetadataDTO;
}

interface AchievementUnlockNotificationPayload {
  type: "achievement";
  content: string;
  metadata: NotificationMetadataDTO;
}

const XP_ACTIONS = {
  study_review: 5,
  card_created: 25,
} as const;

export type XpAction = keyof typeof XP_ACTIONS;

export const PROGRESSION_TIERS: TierDefinitionDTO[] = [
  { name: "Bronze", thresholdXp: 0, logoUrl: "/tiers/bronze.png" },
  { name: "Silver", thresholdXp: 500, logoUrl: "/tiers/silver.png" },
  { name: "Gold", thresholdXp: 1500, logoUrl: "/tiers/gold.png" },
  { name: "Platinum", thresholdXp: 3000, logoUrl: "/tiers/platinum.png" },
  { name: "Titanium", thresholdXp: 5000, logoUrl: "/tiers/titanium.png" },
  { name: "Legendary", thresholdXp: 8000, logoUrl: "/tiers/legendary.png" },
  { name: "Godlike", thresholdXp: 12000, logoUrl: "/tiers/godlike.png" },
];

export function resolveTierByXp(xp: number): TierDefinitionDTO {
  for (let i = PROGRESSION_TIERS.length - 1; i >= 0; i--) {
    const tier = PROGRESSION_TIERS[i];
    if (xp >= tier.thresholdXp) {
      return tier;
    }
  }

  return PROGRESSION_TIERS[0];
}

export function resolveNextTier(xp: number): TierDefinitionDTO | null {
  for (let i = 0; i < PROGRESSION_TIERS.length; i++) {
    const tier = PROGRESSION_TIERS[i];
    if (xp < tier.thresholdXp) {
      return tier;
    }
  }

  return null;
}

export async function ensureUserStatsRow(userId: number): Promise<void> {
  await db.queryAsync(
    `
    INSERT INTO user_stats (user_id, total_terms_learned, daily_streak, accuracy, xp, current_tier)
    VALUES ($1, 0, 0, 0, 0, 'Bronze')
    ON CONFLICT (user_id) DO NOTHING
    `,
    [userId]
  );
}

async function getUserStatsProgress(userId: number): Promise<UserStatsProgressRow> {
  await ensureUserStatsRow(userId);

  const result = await db.queryAsync(
    `
    SELECT COALESCE(xp, 0) AS xp, COALESCE(current_tier, 'Bronze') AS current_tier
    FROM user_stats
    WHERE user_id = $1
    `,
    [userId]
  );

  const row = result.rows[0] as UserStatsProgressRow | undefined;

  return {
    xp: Number(row?.xp ?? 0),
    current_tier: (row?.current_tier ?? "Bronze") as TierNameDTO,
  };
}

export async function applyXpAction(userId: number, action: XpAction): Promise<ProgressionActionResult> {
  const xpAwarded = XP_ACTIONS[action];
  const current = await getUserStatsProgress(userId);

  const newXp = current.xp + xpAwarded;
  const nextTier = resolveTierByXp(newXp);

  await db.queryAsync(
    `
    UPDATE user_stats
    SET xp = $2,
        current_tier = $3
    WHERE user_id = $1
    `,
    [userId, newXp, nextTier.name]
  );

  return {
    xpAwarded,
    newXp,
    previousTier: current.current_tier,
    currentTier: nextTier.name,
    unlockedTier: current.current_tier !== nextTier.name ? nextTier : null,
  };
}

export async function getTierProgressSummary(userId: number): Promise<UserTierProgressDTO> {
  const stats = await getUserStatsProgress(userId);

  const percentileResult = await db.queryAsync(
    `
    WITH ranked AS (
      SELECT
        user_id,
        COALESCE(xp, 0) AS xp,
        PERCENT_RANK() OVER (ORDER BY COALESCE(xp, 0)) AS percentile
      FROM user_stats
    )
    SELECT xp, percentile
    FROM ranked
    WHERE user_id = $1
    `,
    [userId]
  );

  const percentileRow = percentileResult.rows[0] as TierPercentileRow | undefined;
  const currentXp = Number(percentileRow?.xp ?? stats.xp ?? 0);
  const percentileRanking = Math.round(Number(percentileRow?.percentile ?? 0) * 10000) / 100;

  const currentTier = resolveTierByXp(currentXp);
  const nextTier = resolveNextTier(currentXp);

  return {
    currentTier,
    currentXp,
    percentileRanking,
    nextUnlock: nextTier
      ? {
          tier: nextTier,
          xpRemaining: Math.max(nextTier.thresholdXp - currentXp, 0),
        }
      : null,
  };
}

async function getConditionProgress(userId: number, conditionType: AchievementConditionTypeDTO): Promise<number> {
  if (conditionType === "cards_created_total") {
    const result = await db.queryAsync(
      `SELECT COUNT(*) AS total FROM cards WHERE user_id = $1`,
      [userId]
    );
    const row = result.rows[0] as CountRow | undefined;
    return Number(row?.total ?? 0);
  }

  const result = await db.queryAsync(
    `SELECT COUNT(*) AS total FROM study_activity WHERE user_id = $1`,
    [userId]
  );
  const row = result.rows[0] as CountRow | undefined;
  return Number(row?.total ?? 0);
}

function toAchievementBadge(row: AchievementRow, progress: number): AchievementBadgeDTO {
  return {
    key: row.key,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    conditionType: row.condition_type,
    target: Number(row.condition_value),
    progress,
    unlocked: Boolean(row.unlocked_at),
    unlockedAt: row.unlocked_at,
  };
}

export async function evaluateAchievements(userId: number): Promise<AchievementUnlockResult> {
  const result = await db.queryAsync(
    `
    SELECT
      a.id,
      a.key,
      a.name,
      a.description,
      a.image_url,
      a.condition_type,
      a.condition_value,
      ua.unlocked_at
    FROM achievements a
    LEFT JOIN user_achievements ua
      ON ua.achievement_id = a.id
     AND ua.user_id = $1
    ORDER BY a.id ASC
    `,
    [userId]
  );

  const rows = result.rows as AchievementRow[];
  const progressCache = new Map<AchievementConditionTypeDTO, number>();
  const unlockedBadges: AchievementBadgeDTO[] = [];
  const badges: AchievementBadgeDTO[] = [];

  for (const row of rows) {
    const cached = progressCache.get(row.condition_type);
    const progress = typeof cached === "number"
      ? cached
      : await getConditionProgress(userId, row.condition_type);

    if (typeof cached !== "number") {
      progressCache.set(row.condition_type, progress);
    }

    let unlockedAt = row.unlocked_at;

    if (!unlockedAt && progress >= Number(row.condition_value)) {
      const unlockResult = await db.queryAsync(
        `
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, achievement_id) DO NOTHING
        RETURNING unlocked_at
        `,
        [userId, row.id]
      );

      const insertedAt = unlockResult.rows[0]?.unlocked_at as string | undefined;
      if (insertedAt) {
        unlockedAt = insertedAt;
      }
    }

    const badge = toAchievementBadge(
      {
        ...row,
        unlocked_at: unlockedAt,
      },
      progress
    );

    badges.push(badge);

    if (badge.unlocked && !row.unlocked_at) {
      unlockedBadges.push(badge);
    }
  }

  return {
    unlockedBadges,
    badges,
  };
}

export async function awardNewAchievementToQualifiedUsers(
  achievement: NewAchievementInput
): Promise<number[]> {
  const conditionValue = Number(achievement.conditionValue);

  if (achievement.conditionType === "cards_created_total") {
    const result = await db.queryAsync(
      `
      WITH qualified AS (
        SELECT user_id
        FROM cards
        GROUP BY user_id
        HAVING COUNT(*) >= $1
      ),
      inserted AS (
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
        SELECT q.user_id, $2, NOW()
        FROM qualified q
        ON CONFLICT (user_id, achievement_id) DO NOTHING
        RETURNING user_id
      )
      SELECT user_id FROM inserted
      `,
      [conditionValue, achievement.id]
    );

    return (result.rows as { user_id: number }[]).map((row) => Number(row.user_id));
  }

  const result = await db.queryAsync(
    `
    WITH qualified AS (
      SELECT user_id
      FROM study_activity
      GROUP BY user_id
      HAVING COUNT(*) >= $1
    ),
    inserted AS (
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT q.user_id, $2, NOW()
      FROM qualified q
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING user_id
    )
    SELECT user_id FROM inserted
    `,
    [conditionValue, achievement.id]
  );

  return (result.rows as { user_id: number }[]).map((row) => Number(row.user_id));
}

export function buildTierUnlockNotification(tier: TierDefinitionDTO): TierUnlockNotificationPayload {
  return {
    type: "tier",
    content: `You unlocked the ${tier.name} tier!`,
    metadata: {
      popupType: "tier_unlock",
      tierName: tier.name,
    },
  };
}

export function buildAchievementUnlockNotification(
  badge: AchievementBadgeDTO
): AchievementUnlockNotificationPayload {
  return {
    type: "achievement",
    content: `Achievement unlocked: ${badge.name}`,
    metadata: {
      popupType: "achievement_unlock",
      achievementKey: badge.key,
    },
  };
}
