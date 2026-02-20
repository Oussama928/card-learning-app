import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { requireGroupTeacher } from "@/lib/studyGroups";
import type { DeleteStudyGroupPostResponseDTO } from "@/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    const { id, postId } = await params;
    const groupId = Number(id);
    const parsedPostId = Number(postId);

    if (!groupId || !parsedPostId) {
      return NextResponse.json({ error: "Invalid group or post id" }, { status: 400 });
    }

    await requireGroupTeacher(groupId, userId);

    const postResult = await db.queryAsync(
      `SELECT id, group_id FROM study_group_posts WHERE id = $1`,
      [parsedPostId]
    );

    const post = postResult.rows[0] as { id: number; group_id: number } | undefined;
    if (!post || Number(post.group_id) !== groupId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await db.queryAsync(`DELETE FROM study_group_posts WHERE id = $1`, [parsedPostId]);

    const response: DeleteStudyGroupPostResponseDTO = { message: "Post deleted" };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_TEACHER") {
      return NextResponse.json({ error: "Teacher permission required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
