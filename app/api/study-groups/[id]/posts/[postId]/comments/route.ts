import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { requireGroupMember } from "@/lib/studyGroups";
import type { CreateStudyGroupCommentRequestDTO, StudyGroupRole } from "@/types";

export async function POST(
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

    const access = await requireGroupMember(groupId, userId);

    const postResult = await db.queryAsync(
      `SELECT id, group_id FROM study_group_posts WHERE id = $1`,
      [parsedPostId]
    );

    const post = postResult.rows[0] as { id: number; group_id: number } | undefined;
    if (!post || Number(post.group_id) !== groupId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = (await request.json()) as Partial<CreateStudyGroupCommentRequestDTO>;
    const content = String(body.content || "").trim();
    const parentCommentId = body.parentCommentId ? Number(body.parentCommentId) : null;

    if (!content) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    if (parentCommentId) {
      const parentResult = await db.queryAsync(
        `SELECT id, post_id FROM study_group_post_comments WHERE id = $1`,
        [parentCommentId]
      );

      const parent = parentResult.rows[0] as { id: number; post_id: number } | undefined;
      if (!parent || Number(parent.post_id) !== parsedPostId) {
        return NextResponse.json({ error: "Parent comment not found for this post" }, { status: 404 });
      }
    }

    const insert = await db.queryAsync(
      `
      INSERT INTO study_group_post_comments
        (post_id, parent_comment_id, author_user_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, post_id, parent_comment_id, author_user_id, content, created_at
      `,
      [parsedPostId, parentCommentId, userId, content]
    );

    const row = insert.rows[0] as Record<string, unknown>;

    return NextResponse.json(
      {
        message: "Comment posted",
        comment: {
          id: Number(row.id),
          postId: Number(row.post_id),
          parentCommentId: row.parent_comment_id ? Number(row.parent_comment_id) : null,
          authorUserId: Number(row.author_user_id),
          authorRole: access.role as StudyGroupRole,
          content: String(row.content || ""),
          createdAt: String(row.created_at || ""),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_MEMBER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
