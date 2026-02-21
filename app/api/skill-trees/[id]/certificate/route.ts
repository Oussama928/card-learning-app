import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { buildCertificatePdf } from "@/lib/skillTreeService";

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

    const completedResult = await db.queryAsync(
      `SELECT completed_at FROM skill_tree_user_trees WHERE user_id = $1 AND tree_id = $2`,
      [userId, treeId]
    );

    if (!completedResult.rows[0]?.completed_at) {
      return NextResponse.json({ error: "Skill tree not completed" }, { status: 403 });
    }

    const pdfBuffer = await buildCertificatePdf(treeId, userId);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=skill-tree-${treeId}-certificate.pdf`,
      },
    });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to generate certificate", detail }, { status: 500 });
  }
}
