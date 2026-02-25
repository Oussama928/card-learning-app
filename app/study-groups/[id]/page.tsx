"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CommentNode from "@/app/components/studyGroups/CommentNode";
import { Pagination } from "@/app/components/Pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Trash2, 
  Clock, 
  User, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Send
} from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-destructive">
        Please sign in to use Study Groups
      </div>
    );
  }

  if (!groupId) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-destructive">Invalid group id</div>;
  }

  return (
    <main className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
      <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/study-groups" className="hover:text-primary transition-colors">
                Study Group
              </Link>
              <span>/</span>
              <span>Details</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{group?.name || `Group #${groupId}`}</h1>
            <p className="text-muted-foreground">{group?.description || "Collaborative classroom workspace"}</p>
          </div>
          <Link href="/study-groups">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to groups
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* Tabs Control */}
        <div className="flex p-1 bg-muted rounded-lg w-fit">
          <Button
            variant={tab === "assignments" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTab("assignments")}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Assignments
          </Button>
          <Button
             variant={tab === "posts" ? "secondary" : "ghost"}
             size="sm"
             onClick={() => setTab("posts")}
             className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Posts
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tab === "assignments" ? (
          <div className="space-y-6">
            {isTeacher && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign material</CardTitle>
                  <CardDescription>Create a new assignment for your students.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitAssignment} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="assignment-type">Type</Label>
                        <select
                          id="assignment-type"
                          value={assignmentType}
                          onChange={(e) => setAssignmentType(e.target.value === "class" ? "class" : "card")}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="card">Card assignment</option>
                          <option value="class">Class assignment</option>
                        </select>
                      </div>

                      {assignmentType === "card" ? (
                        <div className="space-y-2">
                          <Label htmlFor="card-id">Card ID</Label>
                          <Input
                            id="card-id"
                            value={assignmentCardId}
                            onChange={(e) => setAssignmentCardId(e.target.value)}
                            placeholder="e.g. 123"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="class-id">Class ID</Label>
                          <Input
                            id="class-id"
                            value={assignmentClassId}
                            onChange={(e) => setAssignmentClassId(e.target.value)}
                            placeholder="e.g. 456"
                          />
                        </div>
                      )}

                      <div className="space-y-2 md:col-span-2">
                         <Label htmlFor="title">Title (Optional)</Label>
                         <Input
                          id="title"
                          value={assignmentTitle}
                          onChange={(e) => setAssignmentTitle(e.target.value)}
                          placeholder="Assignment title"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                         <Label htmlFor="due-date">Due Date</Label>
                         <Input
                          id="due-date"
                          type="datetime-local"
                          value={assignmentDueAt}
                          onChange={(e) => setAssignmentDueAt(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full md:w-auto">
                      Create Assignment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Assigned Material</h2>
              {assignments.length === 0 ? (
                <div className="text-center py-12 rounded-lg border border-dashed text-muted-foreground">
                  No assignments yet.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pagedAssignments.map((item) => (
                      <Card key={item.id} className="bg-card">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              {item.assignmentType === "card" && item.cardId ? (
                                <Link
                                  href={`/learning/${item.cardId}`}
                                  className="text-lg font-semibold hover:text-primary transition-colors hover:underline"
                                >
                                  {item.title || "Card Assignment"}
                                </Link>
                              ) : (
                                <h3 className="text-lg font-semibold">
                                  {item.title || `${item.assignmentType.toUpperCase()} Assignment`}
                                </h3>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                  {item.assignmentType}
                                </Badge>
                                <span>ID: {item.assignmentType === "card" ? item.cardId : item.classId}</span>
                              </div>
                            </div>
                            {isTeacher && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => void handleDeleteAssignment(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3 text-sm text-muted-foreground space-y-1">
                           <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>{item.assignedByName || `User #${item.assignedBy}`}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                           </div>
                           {item.dueAt ? (
                            <div className="flex items-center gap-2 text-amber-500 font-medium">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              Due: {new Date(item.dueAt).toLocaleString()}
                            </div>
                           ) : (
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="h-2 w-2 rounded-full bg-slate-300" />
                                No deadline
                             </div>
                           )}
                        </CardContent>
                        {item.assignmentType === "card" && item.cardId && (
                           <CardFooter>
                              <Link href={`/learning/${item.cardId}`} className="w-full">
                                <Button className="w-full" variant="secondary">
                                  Start Learning
                                </Button>
                              </Link>
                           </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                  <Pagination
                    page={assignmentsPage}
                    totalPages={assignmentTotalPages}
                    onPageChange={setAssignmentsPage}
                    className="mt-6"
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {isTeacher && (
              <Card>
                <CardHeader>
                   <CardTitle>New Announcement</CardTitle>
                   <CardDescription>Share updates, links, or images with your group.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitPost} className="space-y-4">
                    <div className="space-y-2">
                       <Label htmlFor="post-type">Content Type</Label>
                       <select
                        id="post-type"
                        value={postType}
                        onChange={(e) => setPostType(e.target.value as "text" | "link" | "image")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="text">Text only</option>
                        <option value="link">Link</option>
                        <option value="image">Image</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="post-content">Message</Label>
                      <Textarea
                        id="post-content"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="min-h-[100px]"
                      />
                    </div>

                    {postType === "link" && (
                      <div className="space-y-2">
                         <Label htmlFor="link-url">Link URL</Label>
                         <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="link-url"
                              value={postLinkUrl}
                              onChange={(e) => setPostLinkUrl(e.target.value)}
                              placeholder="https://example.com"
                              className="pl-9"
                            />
                         </div>
                      </div>
                    )}

                    {postType === "image" && (
                       <div className="space-y-2">
                         <Label htmlFor="image-url">Image URL</Label>
                         <div className="relative">
                            <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="image-url"
                              value={postImageUrl}
                              onChange={(e) => setPostImageUrl(e.target.value)}
                              placeholder="https://..."
                              className="pl-9"
                            />
                         </div>
                      </div>
                    )}

                    <Button type="submit">Publish Post</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {posts.length === 0 ? (
                 <div className="text-center py-12 rounded-lg border border-dashed text-muted-foreground">
                  No posts yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {pagedPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardHeader className="pb-3 bg-muted/30">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20">
                                {(post.authorName || "T")[0].toUpperCase()}
                             </div>
                             <div>
                                <p className="text-sm font-semibold">{post.authorName || "Teacher"}</p>
                                <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                             </div>
                          </div>
                          {isTeacher && (
                            <Button
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => void handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>

                        {post.linkUrl && (
                          <a
                            href={post.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline p-3 bg-primary/5 rounded-md border border-primary/10 transition-colors hover:bg-primary/10"
                          >
                            <LinkIcon className="h-4 w-4" />
                            {post.linkUrl}
                          </a>
                        )}

                        {post.imageUrl && (
                          <div className="rounded-lg overflow-hidden border">
                            <img src={post.imageUrl} alt="Post attachment" className="w-full object-cover max-h-[400px]" />
                          </div>
                        )}
                        
                        <div className="pt-2">
                          <div className="flex gap-2">
                            <Input
                              value={postComments[post.id] || ""}
                              onChange={(e) =>
                                setPostComments((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Write a comment..."
                              className="h-9 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  void submitPostComment(post.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => void submitPostComment(post.id)}
                              disabled={!postComments[post.id]?.trim()}
                              className="h-9 px-3"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {post.comments.length > 0 && (
                          <div className="space-y-4 pt-2">
                            <div className="relative">
                               <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                               <div className="space-y-3">
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
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
      </div>
    </main>
  );
}
