import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { requireGroupTeacher } from "@/lib/studyGroups";
import type { DeleteStudyGroupCommentResponseDTO } from "@/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    const { id, postId, commentId } = await params;
    const groupId = Number(id);
    const parsedPostId = Number(postId);
    const parsedCommentId = Number(commentId);

    if (!groupId || !parsedPostId || !parsedCommentId) {
      return NextResponse.json({ error: "Invalid group, post, or comment id" }, { status: 400 });
    }

    await requireGroupTeacher(groupId, userId);

    const commentResult = await db.queryAsync(
      `
      SELECT c.id, c.post_id, p.group_id
      FROM study_group_post_comments c
      INNER JOIN study_group_posts p ON p.id = c.post_id
      WHERE c.id = $1
      `,
      [parsedCommentId]
    );

    const comment = commentResult.rows[0] as { id: number; post_id: number; group_id: number } | undefined;

    if (!comment || Number(comment.post_id) !== parsedPostId || Number(comment.group_id) !== groupId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await db.queryAsync(`DELETE FROM study_group_post_comments WHERE id = $1`, [parsedCommentId]);

    const response: DeleteStudyGroupCommentResponseDTO = { message: "Comment deleted" };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_TEACHER") {
      return NextResponse.json({ error: "Teacher permission required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
