import { NextRequest, NextResponse } from "next/server";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { getSkillTreesSummary } from "@/lib/skillTreeService";
import type { GetSkillTreesResponseDTO } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await authenticateRequest(request);
    const url = new URL(request.url);
    const language = url.searchParams.get("language");

    const response: GetSkillTreesResponseDTO = await getSkillTreesSummary(
      userId,
      language ? language.trim() : null
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to load skill trees", detail }, { status: 500 });
  }
}
