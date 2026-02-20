"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CommentNode from "@/app/components/studyGroups/CommentNode";
import { Pagination } from "@/app/components/Pagination";
import type {
  CreateStudyGroupAssignmentRequestDTO,
  CreateStudyGroupCommentRequestDTO,
  CreateStudyGroupPostRequestDTO,
  StudyAssignmentType,
  StudyGroupAssignmentDTO,
  StudyGroupDTO,
  StudyGroupPostDTO,
} from "@/types";
import {
  createStudyGroupAssignment,
  createStudyGroupComment,
  createStudyGroupPost,
  deleteStudyGroupAssignment,
  deleteStudyGroupComment,
  deleteStudyGroupPost,
  getStudyGroupAssignments,
  getStudyGroupPosts,
  getStudyGroups,
} from "@/services/studyGroupService";

export default function StudyGroupDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const groupId = Number(params?.id);

  const [tab, setTab] = React.useState<"assignments" | "posts">("assignments");
  const [group, setGroup] = React.useState<StudyGroupDTO | null>(null);
  const [assignments, setAssignments] = React.useState<StudyGroupAssignmentDTO[]>([]);
  const [posts, setPosts] = React.useState<StudyGroupPostDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [assignmentsPage, setAssignmentsPage] = React.useState(1);
  const [postsPage, setPostsPage] = React.useState(1);
  const assignmentsPageSize = 6;
  const postsPageSize = 4;

  const [assignmentType, setAssignmentType] = React.useState<StudyAssignmentType>("card");
  const [assignmentCardId, setAssignmentCardId] = React.useState("");
  const [assignmentClassId, setAssignmentClassId] = React.useState("");
  const [assignmentTitle, setAssignmentTitle] = React.useState("");
  const [assignmentDueAt, setAssignmentDueAt] = React.useState("");

  const [postType, setPostType] = React.useState<"text" | "link" | "image">("text");
  const [postContent, setPostContent] = React.useState("");
  const [postLinkUrl, setPostLinkUrl] = React.useState("");
  const [postImageUrl, setPostImageUrl] = React.useState("");

  const [postComments, setPostComments] = React.useState<Record<number, string>>({});

  const accessToken = session?.user?.accessToken;
  const isTeacher = group?.role === "teacher";
  const canReply = Boolean(group);

  const loadAll = React.useCallback(async () => {
    if (!accessToken || !groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [groupsData, assignmentsData, postsData] = await Promise.all([
        getStudyGroups(accessToken),
        getStudyGroupAssignments(groupId, accessToken),
        getStudyGroupPosts(groupId, accessToken),
      ]);

      const found = groupsData.groups.find((item) => item.id === groupId) || null;
      setGroup(found);
      setAssignments(assignmentsData.assignments || []);
      setPosts(postsData.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group details");
    } finally {
      setLoading(false);
    }
  }, [accessToken, groupId]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const assignmentTotalPages = Math.max(1, Math.ceil(assignments.length / assignmentsPageSize));
  const postTotalPages = Math.max(1, Math.ceil(posts.length / postsPageSize));
  const pagedAssignments = assignments.slice(
    (assignmentsPage - 1) * assignmentsPageSize,
    assignmentsPage * assignmentsPageSize
  );
  const pagedPosts = posts.slice((postsPage - 1) * postsPageSize, postsPage * postsPageSize);

  React.useEffect(() => {
    if (assignmentsPage > assignmentTotalPages) {
      setAssignmentsPage(assignmentTotalPages);
    }
  }, [assignmentsPage, assignmentTotalPages]);

  React.useEffect(() => {
    if (postsPage > postTotalPages) {
      setPostsPage(postTotalPages);
    }
  }, [postsPage, postTotalPages]);

  React.useEffect(() => {
    if (tab === "assignments") {
      setAssignmentsPage(1);
    } else {
      setPostsPage(1);
    }
  }, [tab]);

  const submitAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken || !groupId || !isTeacher) return;

    const payload: CreateStudyGroupAssignmentRequestDTO = {
      assignmentType,
      cardId: assignmentType === "card" ? Number(assignmentCardId || 0) || undefined : undefined,
      classId: assignmentType === "class" ? Number(assignmentClassId || 0) || undefined : undefined,
      title: assignmentTitle.trim() || undefined,
      dueAt: assignmentDueAt || undefined,
    };

    try {
      setError(null);
      await createStudyGroupAssignment(groupId, payload, accessToken);
      setAssignmentCardId("");
      setAssignmentClassId("");
      setAssignmentTitle("");
      setAssignmentDueAt("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    }
  };

  const submitPost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken || !groupId || !isTeacher) return;

    const payload: CreateStudyGroupPostRequestDTO = {
      postType,
      content: postContent.trim(),
      linkUrl: postType === "link" ? postLinkUrl.trim() || undefined : undefined,
      imageUrl: postType === "image" ? postImageUrl.trim() || undefined : undefined,
    };

    try {
      setError(null);
      await createStudyGroupPost(groupId, payload, accessToken);
      setPostContent("");
      setPostLinkUrl("");
      setPostImageUrl("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    }
  };

  const submitPostComment = async (postId: number) => {
    if (!accessToken || !groupId) return;

    const value = (postComments[postId] || "").trim();
    if (!value) return;

    const payload: CreateStudyGroupCommentRequestDTO = {
      content: value,
    };

    try {
      setError(null);
      await createStudyGroupComment(groupId, postId, payload, accessToken);
      setPostComments((prev) => ({ ...prev, [postId]: "" }));
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    }
  };

  const handleReply = async (postId: number, parentCommentId: number, content: string) => {
    if (!accessToken || !groupId) return;

    const payload: CreateStudyGroupCommentRequestDTO = {
      content,
      parentCommentId,
    };

    await createStudyGroupComment(groupId, postId, payload, accessToken);
    await loadAll();
  };

  const handleDeletePost = async (postId: number) => {
    if (!accessToken || !groupId || !isTeacher) return;
    if (!window.confirm("Delete this post? ")) return;

    try {
      await deleteStudyGroupPost(groupId, postId, accessToken);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!accessToken || !groupId || !isTeacher) return;
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteStudyGroupComment(groupId, postId, commentId, accessToken);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!accessToken || !groupId || !isTeacher) return;
    if (!window.confirm("Delete this assignment?")) return;

    try {
      await deleteStudyGroupAssignment(groupId, assignmentId, accessToken);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assignment");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>
    );
  }

  if (!session?.user || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Please sign in to use Study Groups
      </div>
    );
  }

  if (!groupId) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">Invalid group id</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">Study Group</p>
            <h1 className="text-4xl font-bold">{group?.name || `Group #${groupId}`}</h1>
            <p className="mt-2 text-slate-300">{group?.description || "Collaborative classroom workspace"}</p>
          </div>
          <Link href="/study-groups" className="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold">
            Back to groups
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setTab("assignments")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === "assignments" ? "bg-cyan-300 text-slate-900" : "border border-white/20"
            }`}
          >
            Assignments
          </button>
          <button
            type="button"
            onClick={() => setTab("posts")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === "posts" ? "bg-cyan-300 text-slate-900" : "border border-white/20"
            }`}
          >
            Posts
          </button>
        </div>

        {loading ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 text-slate-300">Loading...</div>
        ) : tab === "assignments" ? (
          <div className="mt-8 space-y-6">
            {isTeacher ? (
              <form onSubmit={submitAssignment} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-cyan-200">Assign material</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value === "class" ? "class" : "card")}
                    className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
                  >
                    <option value="card">Card assignment</option>
                    <option value="class">Class assignment</option>
                  </select>

                  {assignmentType === "card" ? (
                    <input
                      value={assignmentCardId}
                      onChange={(e) => setAssignmentCardId(e.target.value)}
                      placeholder="Card id"
                      className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
                    />
                  ) : (
                    <input
                      value={assignmentClassId}
                      onChange={(e) => setAssignmentClassId(e.target.value)}
                      placeholder="Class id"
                      className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
                    />
                  )}

                  <input
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="Assignment title (optional)"
                    className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2 md:col-span-2"
                  />

                  <input
                    type="datetime-local"
                    value={assignmentDueAt}
                    onChange={(e) => setAssignmentDueAt(e.target.value)}
                    className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2 md:col-span-2"
                  />
                </div>
                <button type="submit" className="mt-4 rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-900">
                  Create assignment
                </button>
              </form>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Assigned material</h2>
              {assignments.length === 0 ? (
                <p className="mt-3 text-slate-300">No assignments yet.</p>
              ) : (
                <div className="mt-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {pagedAssignments.map((item) => (
                      <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            {item.assignmentType === "card" && item.cardId ? (
                              <Link
                                href={`/learning/${item.cardId}`}
                                className="font-semibold text-cyan-100 hover:text-cyan-200"
                              >
                                {item.title || "Card assignment"}
                              </Link>
                            ) : (
                              <p className="font-semibold text-cyan-100">
                                {item.title || `${item.assignmentType.toUpperCase()} assignment`}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-slate-300">
                              {item.assignmentType === "card"
                                ? `Card ID: ${item.cardId ?? "-"}`
                                : `Class ID: ${item.classId ?? "-"}`}
                            </p>
                          </div>
                          {isTeacher ? (
                            <button
                              type="button"
                              onClick={() => void handleDeleteAssignment(item.id)}
                              className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          Assigned by {item.assignedByName || `user #${item.assignedBy}`} • {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {item.dueAt ? (
                          <p className="mt-1 text-xs text-amber-300">Deadline: {new Date(item.dueAt).toLocaleString()}</p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">No deadline</p>
                        )}
                        {item.assignmentType === "card" && item.cardId ? (
                          <Link
                            href={`/learning/${item.cardId}`}
                            className="mt-3 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                          >
                            Start learning →
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <Pagination
                    page={assignmentsPage}
                    totalPages={assignmentTotalPages}
                    onPageChange={setAssignmentsPage}
                    className="mt-6"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {isTeacher ? (
              <form onSubmit={submitPost} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold text-cyan-200">New announcement</h2>
                <div className="mt-4 space-y-3">
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value === "link" ? "link" : e.target.value === "image" ? "image" : "text")}
                    className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
                  >
                    <option value="text">Text</option>
                    <option value="link">Link</option>
                    <option value="image">Image</option>
                  </select>

                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Announcement content"
                    className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
                  />

                  {postType === "link" ? (
                    <input
                      value={postLinkUrl}
                      onChange={(e) => setPostLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
                    />
                  ) : null}

                  {postType === "image" ? (
                    <input
                      value={postImageUrl}
                      onChange={(e) => setPostImageUrl(e.target.value)}
                      placeholder="Image URL"
                      className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
                    />
                  ) : null}

                  <button type="submit" className="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-900">
                    Publish post
                  </button>
                </div>
              </form>
            ) : null}

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-slate-300">No posts yet.</div>
              ) : (
                <div>
                  {pagedPosts.map((post) => (
                  <article key={post.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-cyan-100">{post.authorName || "Teacher"}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</span>
                        {isTeacher ? (
                          <button
                            type="button"
                            onClick={() => void handleDeletePost(post.id)}
                            className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-3 text-slate-100">{post.content}</p>

                    {post.linkUrl ? (
                      <a
                        href={post.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-cyan-300 underline"
                      >
                        Open link
                      </a>
                    ) : null}

                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt="Post attachment" className="mt-3 max-h-72 rounded-lg border border-white/10" />
                    ) : null}

                    <div className="mt-4 flex gap-2">
                      <input
                        value={postComments[post.id] || ""}
                        onChange={(e) =>
                          setPostComments((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        placeholder="Add a reply"
                        className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void submitPostComment(post.id)}
                        className="rounded-md bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-900"
                      >
                        Reply
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {post.comments.map((comment) => (
                        <CommentNode
                          key={comment.id}
                          comment={comment}
                          canReply={canReply}
                          onReply={(parentCommentId, content) =>
                            handleReply(post.id, parentCommentId, content)
                          }
                          canDelete={isTeacher}
                          onDelete={(commentId) => handleDeleteComment(post.id, commentId)}
                        />
                      ))}
                    </div>
                  </article>
                  ))}
                  <Pagination
                    page={postsPage}
                    totalPages={postTotalPages}
                    onPageChange={setPostsPage}
                    className="mt-6"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
