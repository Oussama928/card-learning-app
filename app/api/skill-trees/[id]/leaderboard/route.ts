import { NextRequest, NextResponse } from "next/server";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { getSkillTreeLeaderboard } from "@/lib/skillTreeService";
import type { GetSkillTreeLeaderboardResponseDTO } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await authenticateRequest(request);
    const { id } = await params;
    const treeId = Number(id);

    if (!treeId) {
      return NextResponse.json({ error: "Invalid tree id" }, { status: 400 });
    }

    const leaderboard = await getSkillTreeLeaderboard(treeId);
    const response: GetSkillTreeLeaderboardResponseDTO = {
      message: "Leaderboard loaded",
      treeId,
      entries: leaderboard.entries.map((entry) => ({
        userId: entry.userId,
        username: entry.username,
        xpEarned: entry.xpEarned,
        completedAt: entry.completedAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to load leaderboard", detail }, { status: 500 });
  }
}
