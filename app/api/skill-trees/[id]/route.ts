import { NextRequest, NextResponse } from "next/server";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { getSkillTreeDetail } from "@/lib/skillTreeService";
import type { GetSkillTreeResponseDTO } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
    const { id } = await params;
    const treeId = Number(id);

    if (!treeId) {
      return NextResponse.json({ error: "Invalid tree id" }, { status: 400 });
    }

    const response: GetSkillTreeResponseDTO = await getSkillTreeDetail(userId, treeId);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "SKILL_TREE_NOT_FOUND") {
      return NextResponse.json({ error: "Skill tree not found" }, { status: 404 });
    }

    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to load skill tree", detail }, { status: 500 });
  }
}
