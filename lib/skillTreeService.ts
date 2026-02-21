import db from "@/lib/db";
import { notifyUser } from "@/lib/notificationEvents";
import { sendTemplatedEmail } from "@/lib/email/service";
import {
  applyXpReward,
  buildTierUnlockNotification,
  ensureUserStatsRow,
} from "@/lib/progressionService";
import type {
  GetSkillTreeResponseDTO,
  GetSkillTreesResponseDTO,
  SkillTreeDetailDTO,
  SkillTreeNodeDTO,
  SkillTreeSummaryDTO,
  SkillTreeNodeStatus,
  SkillTreeCriteriaType,
  SkillTreeLanguageProgressDTO,
} from "@/types";

interface RawTreeRow {
  id: number;
  language: string;
  name: string;
  description: string | null;
  completion_xp_reward: number;
  badge_name: string | null;
  badge_image_url: string | null;
}

interface RawNodeRow {
  id: number;
  tree_id: number;
  card_id: number | null;
  title: string;
  description: string | null;
  difficulty: string | null;
  xp_reward: number | null;
  criteria_type: string | null;
  required_mastery_pct: number | null;
  required_xp: number | null;
  position_x: number | null;
  position_y: number | null;
  status: string | null;
  unlocked_at: string | null;
  completed_at: string | null;
  xp_awarded: number | null;
}

interface RawEdgeRow {
  parent_node_id: number;
  child_node_id: number;
}

interface CardMasteryRow {
  card_id: number;
  total_words: number;
  learned_words: number;
}

const buildCertificateUrl = (treeId: number) => {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base}/api/skill-trees/${treeId}/certificate`;
};

const mapNodeStatus = (value?: string | null): SkillTreeNodeStatus => {
    // if value not known default it to locked
  if (value === "completed" || value === "unlocked" || value === "locked") {
    return value;
  }
  return "locked";
};
// if value not known default it to locked
const normalizeCriteria = (value?: string | null): SkillTreeCriteriaType =>
  value === "xp" ? "xp" : "card_mastery";

async function getTreeSummaryRows(language?: string | null): Promise<RawTreeRow[]> {
  if (language) {
    const result = await db.queryAsync(
      `SELECT id, language, name, description, completion_xp_reward, badge_name, badge_image_url
       FROM skill_trees
       WHERE language = $1
       ORDER BY created_at ASC`,
      [language]
    );
    return result.rows as RawTreeRow[];
  }

  const result = await db.queryAsync(
    `SELECT id, language, name, description, completion_xp_reward, badge_name, badge_image_url
     FROM skill_trees
     ORDER BY language ASC, created_at ASC`
  );
  return result.rows as RawTreeRow[];
}

async function getTreeNodes(userId: number, treeId: number): Promise<RawNodeRow[]> {
  const result = await db.queryAsync(
    `
    SELECT
      n.id,
      n.tree_id,
      n.card_id,
      n.title,
      n.description,
      n.difficulty,
      n.xp_reward,
      n.criteria_type,
      n.required_mastery_pct,
      n.required_xp,
      n.position_x,
      n.position_y,
      un.status,
      un.unlocked_at,
      un.completed_at,
      un.xp_awarded
    FROM skill_tree_nodes n
    LEFT JOIN skill_tree_user_nodes un
      ON un.node_id = n.id
      AND un.user_id = $1
    WHERE n.tree_id = $2
    ORDER BY n.position_y ASC, n.position_x ASC, n.id ASC
    `,
    [userId, treeId]
  );

  return result.rows as RawNodeRow[];
}

async function getTreeEdges(treeId: number): Promise<RawEdgeRow[]> {
  const result = await db.queryAsync(
    `SELECT parent_node_id, child_node_id FROM skill_tree_edges WHERE tree_id = $1`,
    [treeId]
  );
  return result.rows as RawEdgeRow[];
}

async function getCardMastery(userId: number, cardIds: number[]): Promise<Map<number, CardMasteryRow>> {
  if (cardIds.length === 0) return new Map();

  const result = await db.queryAsync(
    `
    SELECT
      w.card_id,
      COUNT(*)::int AS total_words,
      COALESCE(SUM(CASE WHEN up.is_learned THEN 1 ELSE 0 END), 0)::int AS learned_words
    FROM words w
    LEFT JOIN user_progress up
      ON up.word_id = w.id
      AND up.user_id = $1
    WHERE w.card_id = ANY($2::int[])
    GROUP BY w.card_id
    `,
    [userId, cardIds]
  );

  const map = new Map<number, CardMasteryRow>();
  (result.rows as CardMasteryRow[]).forEach((row) => {
    map.set(Number(row.card_id), {
      card_id: Number(row.card_id),
      total_words: Number(row.total_words || 0),
      learned_words: Number(row.learned_words || 0),
    });
  });
  return map;
}

async function upsertUserNode(
  userId: number,
  nodeId: number,
  status: SkillTreeNodeStatus,
  opts: { unlockedAt?: string | null; completedAt?: string | null; xpAwarded?: number }
) {
  await db.queryAsync(
    `
    INSERT INTO skill_tree_user_nodes (user_id, node_id, status, unlocked_at, completed_at, xp_awarded)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, node_id) DO UPDATE
      SET status = EXCLUDED.status,
          unlocked_at = COALESCE(EXCLUDED.unlocked_at, skill_tree_user_nodes.unlocked_at),
          completed_at = COALESCE(EXCLUDED.completed_at, skill_tree_user_nodes.completed_at),
          xp_awarded = GREATEST(skill_tree_user_nodes.xp_awarded, EXCLUDED.xp_awarded)
    `,
    [
      userId,
      nodeId,
      status,
      opts.unlockedAt ?? null,
      opts.completedAt ?? null,
      opts.xpAwarded ?? 0,
    ]
  );
}

async function updateTreeXp(userId: number, treeId: number, delta: number) {
  await db.queryAsync(
    `
    INSERT INTO skill_tree_user_trees (user_id, tree_id, xp_earned)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, tree_id) DO UPDATE
      SET xp_earned = skill_tree_user_trees.xp_earned + EXCLUDED.xp_earned
    `,
    [userId, treeId, delta]
  );
}

async function finalizeTreeCompletion(
  userId: number,
  tree: RawTreeRow,
  completedNodes: number,
  totalNodes: number
) {
  if (completedNodes < totalNodes || totalNodes === 0) return;

  const existing = await db.queryAsync(
    `SELECT completed_at FROM skill_tree_user_trees WHERE user_id = $1 AND tree_id = $2`,
    [userId, tree.id]
  );

  const alreadyCompleted = Boolean(existing.rows[0]?.completed_at);
  if (alreadyCompleted) return;

  const certificateUrl = buildCertificateUrl(tree.id);

  await db.queryAsync(
    `
    INSERT INTO skill_tree_user_trees (user_id, tree_id, completed_at, badge_awarded, certificate_url, xp_earned)
    VALUES ($1, $2, NOW(), true, $3, 0)
    ON CONFLICT (user_id, tree_id) DO UPDATE
      SET completed_at = NOW(),
          badge_awarded = true,
          certificate_url = EXCLUDED.certificate_url
    `,
    [userId, tree.id, certificateUrl]
  );

  if (tree.completion_xp_reward && tree.completion_xp_reward > 0) {
    const rewardResult = await applyXpReward(userId, tree.completion_xp_reward, "skill_tree_complete");
    if (rewardResult.unlockedTier) {
      const tierNotification = buildTierUnlockNotification(rewardResult.unlockedTier);
      await notifyUser(userId, tierNotification.type, tierNotification.content, tierNotification.metadata);
    }
  }

  await notifyUser(
    userId,
    "achievement",
    `You completed the ${tree.name} skill tree!`,
    {
      popupType: "achievement_unlock",
      achievementKey: tree.badge_name || "skill-tree",
      skillTreeId: tree.id,
      skillTreeName: tree.name,
      certificateUrl,
    }
  );

  const userResult = await db.queryAsync(
    `SELECT email, username FROM users WHERE id = $1`,
    [userId]
  );
  const userRow = userResult.rows[0] as { email?: string; username?: string } | undefined;
  if (userRow?.email) {
    await sendTemplatedEmail({
      to: String(userRow.email),
      template: "skill-tree-certificate",
      data: {
        username: userRow.username || "Learner",
        treeName: tree.name,
        certificateUrl,
      },
    });
  }
}

async function computeTreeProgress(
  userId: number,
  tree: RawTreeRow,
  nodes: RawNodeRow[],
  edges: RawEdgeRow[]
): Promise<SkillTreeDetailDTO> {
  await ensureUserStatsRow(userId);

  const prerequisites = new Map<number, number[]>();
  const children = new Map<number, number[]>();

  edges.forEach((edge) => {
    const pre = prerequisites.get(edge.child_node_id) || [];
    pre.push(edge.parent_node_id);
    prerequisites.set(edge.child_node_id, pre);

    const kids = children.get(edge.parent_node_id) || [];
    kids.push(edge.child_node_id);
    children.set(edge.parent_node_id, kids);
  });

  const cardIds = nodes.map((node) => node.card_id).filter((value): value is number => Boolean(value));
  const masteryMap = await getCardMastery(userId, cardIds);

  const userStatsResult = await db.queryAsync(`SELECT xp FROM user_stats WHERE user_id = $1`, [userId]);
  const userXp = Number(userStatsResult.rows[0]?.xp ?? 0);

  const completedNodeIds = new Set<number>();
  const nextStatuses = new Map<number, SkillTreeNodeStatus>();
  const completionUpdates: Array<Promise<void>> = [];

  for (const node of nodes) {
    const criteriaType = normalizeCriteria(node.criteria_type);
    let meetsCriteria = false;

    if (criteriaType === "xp") {
      const requiredXp = Number(node.required_xp || 0);
      meetsCriteria = requiredXp > 0 ? userXp >= requiredXp : false;
    } else if (node.card_id) {
      const mastery = masteryMap.get(node.card_id);
      if (mastery && mastery.total_words > 0) {
        const requiredPct = Number(node.required_mastery_pct || 100);
        const pct = (mastery.learned_words / mastery.total_words) * 100;
        meetsCriteria = pct >= requiredPct;
      }
    }

    const existingStatus = mapNodeStatus(node.status);
    if (existingStatus === "completed" || meetsCriteria) {
      completedNodeIds.add(node.id);
      nextStatuses.set(node.id, "completed");

      if (existingStatus !== "completed") {
        const reward = Number(node.xp_reward || 0);
        if (reward > 0 && (node.xp_awarded || 0) <= 0) {
          completionUpdates.push(updateTreeXp(userId, node.tree_id, reward));
          const rewardResult = await applyXpReward(userId, reward, "skill_tree_node");
          if (rewardResult.unlockedTier) {
            const tierNotification = buildTierUnlockNotification(rewardResult.unlockedTier);
            await notifyUser(userId, tierNotification.type, tierNotification.content, tierNotification.metadata);
          }
          completionUpdates.push(
            upsertUserNode(userId, node.id, "completed", {
              completedAt: new Date().toISOString(),
              xpAwarded: reward,
            })
          );
        } else {
          completionUpdates.push(
            upsertUserNode(userId, node.id, "completed", {
              completedAt: new Date().toISOString(),
              xpAwarded: node.xp_awarded || 0,
            })
          );
        }
      }
    }
  }

  for (const node of nodes) {
    if (nextStatuses.get(node.id) === "completed") continue;

    const prereqs = prerequisites.get(node.id) || [];
    const allPrereqsMet = prereqs.every((id) => completedNodeIds.has(id));
    const status: SkillTreeNodeStatus = allPrereqsMet ? "unlocked" : "locked";

    nextStatuses.set(node.id, status);

    if (status !== mapNodeStatus(node.status)) {
      completionUpdates.push(
        upsertUserNode(userId, node.id, status, {
          unlockedAt: status === "unlocked" ? new Date().toISOString() : null,
        })
      );
    }
  }

  if (completionUpdates.length) {
    await Promise.all(completionUpdates);
  }

  const normalizedNodes: SkillTreeNodeDTO[] = nodes.map((node) => {
    const status = nextStatuses.get(node.id) || mapNodeStatus(node.status);
    return {
      id: node.id,
      treeId: node.tree_id,
      cardId: node.card_id,
      title: node.title,
      description: node.description,
      difficulty:
        node.difficulty === "advanced" || node.difficulty === "expert" || node.difficulty === "intermediate"
          ? node.difficulty
          : "beginner",
      xpReward: Number(node.xp_reward || 0),
      criteriaType: normalizeCriteria(node.criteria_type),
      requiredMasteryPct: node.required_mastery_pct ?? null,
      requiredXp: node.required_xp ?? null,
      positionX: Number(node.position_x || 0),
      positionY: Number(node.position_y || 0),
      status,
      prerequisites: prerequisites.get(node.id) || [],
      children: children.get(node.id) || [],
      completedAt: node.completed_at,
      unlockedAt: node.unlocked_at,
    };
  });

  const completedNodes = normalizedNodes.filter((node) => node.status === "completed").length;
  const totalNodes = normalizedNodes.length;
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  const xpResult = await db.queryAsync(
    `SELECT xp_earned, completed_at FROM skill_tree_user_trees WHERE user_id = $1 AND tree_id = $2`,
    [userId, tree.id]
  );

  const xpEarned = Number(xpResult.rows[0]?.xp_earned ?? 0);
  const isCompleted = Boolean(xpResult.rows[0]?.completed_at);

  const detail: SkillTreeDetailDTO = {
    id: tree.id,
    language: tree.language,
    name: tree.name,
    description: tree.description,
    badgeName: tree.badge_name,
    badgeImageUrl: tree.badge_image_url,
    completionXpReward: Number(tree.completion_xp_reward || 0),
    totalNodes,
    completedNodes,
    progressPercent,
    xpEarned,
    isCompleted,
    nodes: normalizedNodes,
  };

  await finalizeTreeCompletion(userId, tree, completedNodes, totalNodes);

  return detail;
}

export async function getSkillTreesSummary(
  userId: number,
  language: string | null
): Promise<GetSkillTreesResponseDTO> {
  const languagesResult = await db.queryAsync(`SELECT DISTINCT language FROM skill_trees ORDER BY language ASC`);
  const languages = languagesResult.rows.map((row: Record<string, unknown>) => String(row.language));

  const trees = await getTreeSummaryRows(language);

  const summaries: SkillTreeSummaryDTO[] = [];
  let overallTotalNodes = 0;
  let overallCompletedNodes = 0;
  let overallXp = 0;

  for (const tree of trees) {
    const [nodes, edges] = await Promise.all([getTreeNodes(userId, tree.id), getTreeEdges(tree.id)]);
    const detail = await computeTreeProgress(userId, tree, nodes, edges);

    summaries.push({
      id: detail.id,
      language: detail.language,
      name: detail.name,
      description: detail.description,
      badgeName: detail.badgeName,
      badgeImageUrl: detail.badgeImageUrl,
      completionXpReward: detail.completionXpReward,
      totalNodes: detail.totalNodes,
      completedNodes: detail.completedNodes,
      progressPercent: detail.progressPercent,
      xpEarned: detail.xpEarned,
      isCompleted: detail.isCompleted,
    });

    overallTotalNodes += detail.totalNodes;
    overallCompletedNodes += detail.completedNodes;
    overallXp += detail.xpEarned;
  }

  const overallProgress: SkillTreeLanguageProgressDTO | null = language
    ? {
        language,
        totalNodes: overallTotalNodes,
        completedNodes: overallCompletedNodes,
        progressPercent: overallTotalNodes > 0 ? Math.round((overallCompletedNodes / overallTotalNodes) * 100) : 0,
        xpEarned: overallXp,
      }
    : null;

  return {
    message: "Skill trees loaded",
    language,
    languages,
    trees: summaries,
    overallProgress,
  };
}

export async function getSkillTreeDetail(
  userId: number,
  treeId: number
): Promise<GetSkillTreeResponseDTO> {
  const treeResult = await db.queryAsync(
    `SELECT id, language, name, description, completion_xp_reward, badge_name, badge_image_url FROM skill_trees WHERE id = $1`,
    [treeId]
  );

  const tree = treeResult.rows[0] as RawTreeRow | undefined;
  if (!tree) {
    throw new Error("SKILL_TREE_NOT_FOUND");
  }

  const [nodes, edges] = await Promise.all([getTreeNodes(userId, treeId), getTreeEdges(treeId)]);
  const detail = await computeTreeProgress(userId, tree, nodes, edges);

  return {
    message: "Skill tree loaded",
    tree: detail,
  };
}

export async function syncSkillTreeProgressForCard(userId: number, cardId: number): Promise<void> {
  const nodeResult = await db.queryAsync(
    `SELECT tree_id FROM skill_tree_nodes WHERE card_id = $1`,
    [cardId]
  );

  const treeIds = [...new Set(nodeResult.rows.map((row: Record<string, unknown>) => Number(row.tree_id)))];

  for (const treeId of treeIds) {
    const treeResult = await db.queryAsync(
      `SELECT id, language, name, description, completion_xp_reward, badge_name, badge_image_url FROM skill_trees WHERE id = $1`,
      [treeId]
    );
    const tree = treeResult.rows[0] as RawTreeRow | undefined;
    if (!tree) continue;

    const [nodes, edges] = await Promise.all([getTreeNodes(userId, treeId), getTreeEdges(treeId)]);
    await computeTreeProgress(userId, tree, nodes, edges);
  }
}

export async function getSkillTreeLeaderboard(treeId: number): Promise<{ treeId: number; entries: Array<{ userId: number; username: string; xpEarned: number; completedAt: string | null }> }> {
  const result = await db.queryAsync(
    `
    SELECT
      ut.user_id,
      ut.xp_earned,
      ut.completed_at,
      u.username
    FROM skill_tree_user_trees ut
    INNER JOIN users u ON u.id = ut.user_id
    WHERE ut.tree_id = $1
    ORDER BY ut.xp_earned DESC, ut.completed_at NULLS LAST
    LIMIT 50
    `,
    [treeId]
  );

  return {
    treeId,
    entries: result.rows.map((row: Record<string, unknown>) => ({
      userId: Number(row.user_id),
      username: String(row.username || "Learner"),
      xpEarned: Number(row.xp_earned || 0),
      completedAt: row.completed_at ? String(row.completed_at) : null,
    })),
  };
}

export async function buildCertificatePdf(treeId: number, userId: number): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;

  const treeResult = await db.queryAsync(
    `SELECT name, language FROM skill_trees WHERE id = $1`,
    [treeId]
  );
  const tree = treeResult.rows[0] as { name?: string; language?: string } | undefined;

  const userResult = await db.queryAsync(
    `SELECT username FROM users WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0] as { username?: string } | undefined;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return await new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.fontSize(28).text("Certificate of Completion", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(18).text(`${user?.username || "Learner"}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`has completed the ${tree?.name || "Skill Tree"} (${tree?.language || ""})`, {
      align: "center",
    });
    doc.moveDown(2);
    doc.fontSize(12).text(`Issued on ${new Date().toLocaleDateString()}`, { align: "center" });

    doc.end();
  });
}
