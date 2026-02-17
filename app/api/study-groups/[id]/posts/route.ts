import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AuthRequestError, authenticateRequest } from "@/app/api/authenticateRequest";
import { requireGroupMember, requireGroupTeacher } from "@/lib/studyGroups";
import type {
  CreateStudyGroupPostRequestDTO,
  StudyGroupCommentDTO,
  StudyGroupPostDTO,
  StudyGroupRole,
} from "@/types";

function buildThread(comments: Array<Omit<StudyGroupCommentDTO, "replies">>): StudyGroupCommentDTO[] {
  const map = new Map<number, StudyGroupCommentDTO>();
  const roots: StudyGroupCommentDTO[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach((comment) => {
    const node = map.get(comment.id);
    if (!node) return;

    if (comment.parentCommentId && map.has(comment.parentCommentId)) {
      map.get(comment.parentCommentId)?.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    const { id } = await params;
    const groupId = Number(id);

    if (!groupId) {
      return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    }

    const access = await requireGroupMember(groupId, userId);

    const postsResult = await db.queryAsync(
      `
      SELECT
        p.id,
        p.group_id,
        p.author_user_id,
        p.post_type,
        p.content,
        p.link_url,
        p.image_url,
        p.created_at,
        u.username AS author_name
      FROM study_group_posts p
      INNER JOIN users u ON u.id = p.author_user_id
      WHERE p.group_id = $1
      ORDER BY p.created_at DESC
      LIMIT 50
      `,
      [groupId]
    );

    const postIds = postsResult.rows.map((row: Record<string, unknown>) => Number(row.id));

    const commentsResult = postIds.length
      ? await db.queryAsync(
          `
          SELECT
            c.id,
            c.post_id,
            c.parent_comment_id,
            c.author_user_id,
            c.content,
            c.created_at,
            u.username AS author_name,
            CASE WHEN g.teacher_user_id = c.author_user_id THEN 'teacher' ELSE 'student' END AS author_role
          FROM study_group_post_comments c
          INNER JOIN users u ON u.id = c.author_user_id
          INNER JOIN study_group_posts p ON p.id = c.post_id
          INNER JOIN study_groups g ON g.id = p.group_id
          WHERE c.post_id = ANY($1::int[])
          ORDER BY c.created_at ASC
          `,
          [postIds]
        )
      : { rows: [] as Record<string, unknown>[] };

    const commentsByPost = new Map<number, Array<Omit<StudyGroupCommentDTO, "replies">>>();

    commentsResult.rows.forEach((row: Record<string, unknown>) => {
      const item: Omit<StudyGroupCommentDTO, "replies"> = {
        id: Number(row.id),
        postId: Number(row.post_id),
        parentCommentId: row.parent_comment_id ? Number(row.parent_comment_id) : null,
        authorUserId: Number(row.author_user_id),
        authorName: String(row.author_name || ""),
        authorRole: (row.author_role === "teacher" ? "teacher" : "student") as StudyGroupRole,
        content: String(row.content || ""),
        createdAt: String(row.created_at || ""),
      };

      const bucket = commentsByPost.get(item.postId) || [];
      bucket.push(item);
      commentsByPost.set(item.postId, bucket);
    });

    const posts: StudyGroupPostDTO[] = postsResult.rows.map((row: Record<string, unknown>) => {
      const postId = Number(row.id);
      return {
        id: postId,
        groupId: Number(row.group_id),
        authorUserId: Number(row.author_user_id),
        authorName: String(row.author_name || ""),
        authorRole: Number(row.author_user_id) === access.teacherUserId ? "teacher" : "student",
        postType: row.post_type === "link" ? "link" : row.post_type === "image" ? "image" : "text",
        content: String(row.content || ""),
        linkUrl: row.link_url ? String(row.link_url) : null,
        imageUrl: row.image_url ? String(row.image_url) : null,
        createdAt: String(row.created_at || ""),
        comments: buildThread(commentsByPost.get(postId) || []),
      };
    });

    return NextResponse.json({ message: "Posts loaded", posts });
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_MEMBER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    const { id } = await params;
    const groupId = Number(id);

    if (!groupId) {
      return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    }

    await requireGroupTeacher(groupId, userId);

    const body = (await request.json()) as Partial<CreateStudyGroupPostRequestDTO>;

    const postType = body.postType === "link" ? "link" : body.postType === "image" ? "image" : "text";
    const content = String(body.content || "").trim();
    const linkUrl = String(body.linkUrl || "").trim() || null;
    const imageUrl = String(body.imageUrl || "").trim() || null;

    if (!content) {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }

    if (postType === "link" && !linkUrl) {
      return NextResponse.json({ error: "linkUrl is required for link posts" }, { status: 400 });
    }

    if (postType === "image" && !imageUrl) {
      return NextResponse.json({ error: "imageUrl is required for image posts" }, { status: 400 });
    }

    const result = await db.queryAsync(
      `
      INSERT INTO study_group_posts (group_id, author_user_id, post_type, content, link_url, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, group_id, author_user_id, post_type, content, link_url, image_url, created_at
      `,
      [groupId, userId, postType, content, linkUrl, imageUrl]
    );

    const row = result.rows[0] as Record<string, unknown>;

    return NextResponse.json(
      {
        message: "Post created",
        post: {
          id: Number(row.id),
          groupId: Number(row.group_id),
          authorUserId: Number(row.author_user_id),
          postType: row.post_type === "link" ? "link" : row.post_type === "image" ? "image" : "text",
          content: String(row.content || ""),
          linkUrl: row.link_url ? String(row.link_url) : null,
          imageUrl: row.image_url ? String(row.image_url) : null,
          createdAt: String(row.created_at || ""),
          comments: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthRequestError) {
      return NextResponse.json(error.json, { status: error.status });
    }

    if (error instanceof Error && error.message === "FORBIDDEN_GROUP_TEACHER") {
      return NextResponse.json({ error: "Teacher permission required" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
