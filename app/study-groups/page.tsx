"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Users, Plus, Search, Lock, Globe, Key, Shield } from "lucide-react";
import type {
  CreateStudyGroupRequestDTO,
  JoinStudyGroupRequestDTO,
  PublicStudyGroupDTO,
  StudyGroupDTO,
} from "@/types";
import {
  createStudyGroup,
  getPublicStudyGroups,
  getStudyGroups,
  joinStudyGroup,
} from "@/services/studyGroupService";
import { Pagination } from "../components/Pagination";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";

export default function StudyGroupsPage() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = React.useState<StudyGroupDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [publicQuery, setPublicQuery] = React.useState("");
  const [publicGroups, setPublicGroups] = React.useState<PublicStudyGroupDTO[]>([]);
  const [publicLoading, setPublicLoading] = React.useState(false);
  const [publicError, setPublicError] = React.useState<string | null>(null);
  const [publicPage, setPublicPage] = React.useState(1);
  const [publicTotalPages, setPublicTotalPages] = React.useState(1);
  const publicPageSize = 12;

  const [createName, setCreateName] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createVisibility, setCreateVisibility] = React.useState<"public" | "private">("private");

  const [joinCode, setJoinCode] = React.useState("");
  const [joinGroupId, setJoinGroupId] = React.useState("");

  const accessToken = session?.user?.accessToken;

  const loadGroups = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getStudyGroups(accessToken);
      setGroups(data.groups || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load study groups";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
  const pagedGroups = groups.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  React.useEffect(() => {
    if (publicPage > publicTotalPages) {
      setPublicPage(publicTotalPages);
    }
  }, [publicPage, publicTotalPages]);

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;

    const payload: CreateStudyGroupRequestDTO = {
      name: createName.trim(),
      description: createDescription.trim(),
      visibility: createVisibility,
    };

    if (!payload.name) {
      setError("Group name is required");
      return;
    }

    try {
      setError(null);
      await createStudyGroup(payload, accessToken);
      setCreateName("");
      setCreateDescription("");
      setCreateVisibility("private");
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  const handleJoinGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;

    const parsedGroupId = Number(joinGroupId);

    const payload: JoinStudyGroupRequestDTO = {
      groupId: Number.isNaN(parsedGroupId) || parsedGroupId <= 0 ? undefined : parsedGroupId,
      joinCode: joinCode.trim() || undefined,
    };

    if (!payload.groupId && !payload.joinCode) {
      setError("Enter a join code or group id");
      return;
    }

    try {
      setError(null);
      await joinStudyGroup(payload, accessToken);
      setJoinCode("");
      setJoinGroupId("");
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    }
  };

  const searchPublicGroups = React.useCallback(
    async (pageToLoad = 1) => {
      if (!accessToken) return;
      const trimmed = publicQuery.trim();
      if (!trimmed) {
        setPublicGroups([]);
        setPublicTotalPages(1);
        return;
      }

      try {
        setPublicLoading(true);
        setPublicError(null);
        const data = await getPublicStudyGroups(
          { query: trimmed, page: pageToLoad, limit: publicPageSize },
          accessToken
        );
        setPublicGroups(data.groups || []);
        setPublicTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        setPublicError(err instanceof Error ? err.message : "Failed to search public groups");
      } finally {
        setPublicLoading(false);
      }
    },
    [accessToken, publicQuery, publicPageSize]
  );

  React.useEffect(() => {
    if (!publicQuery.trim()) return;
    void searchPublicGroups(publicPage);
  }, [publicPage, publicQuery, searchPublicGroups]);

  const handlePublicSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPublicPage(1);
    await searchPublicGroups(1);
  };

  const handleJoinPublicGroup = async (groupId: number) => {
    if (!accessToken) return;
    try {
      await joinStudyGroup({ groupId }, accessToken);
      await loadGroups();
      await searchPublicGroups(publicPage);
    } catch (err) {
      setPublicError(err instanceof Error ? err.message : "Failed to join group");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  if (!session?.user || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        Please sign in to use Study Groups
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-6 py-16 space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Study Groups</h1>
          <p className="text-muted-foreground text-lg">Create classes, invite students, and collaborate with announcements.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Groups
            </CardTitle>
            <CardDescription>Quick access to classes you teach or attend.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading groups...</p>
            ) : groups.length === 0 ? (
              <p className="text-muted-foreground">No groups yet.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pagedGroups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/study-groups/${group.id}`}
                      className="block h-full"
                    >
                      <Card className="h-full hover:bg-muted/50 transition-colors border-2 hover:border-primary/50 cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-semibold truncate text-primary">{group.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2 space-y-3">
                           <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
                            {group.description || "No description"}
                          </p>
                           <div className="flex flex-wrap gap-2">
                             <Badge variant={group.role === 'teacher' ? 'default' : 'secondary'}>
                                {group.role}
                             </Badge>
                             <Badge variant="outline">
                               {group.visibility === 'public' ? <Globe className="h-3 w-3 mr-1"/> : <Lock className="h-3 w-3 mr-1"/>}
                               {group.visibility}
                             </Badge>
                           </div>
                        </CardContent>
                        <CardFooter>
                          {group.role === "teacher" && group.joinCode && (
                            <div className="text-xs text-muted-foreground w-full bg-muted/50 p-2 rounded text-center font-mono">
                              Code: <span className="font-bold select-all">{group.joinCode}</span>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Plus className="h-5 w-5" />
                 Create Group
               </CardTitle>
               <CardDescription>Start a private or public learning space.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Group name"
                  />
                  <Textarea
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Description"
                    className="min-h-[100px]"
                  />
                  <select
                    value={createVisibility}
                    onChange={(e) => setCreateVisibility(e.target.value === "public" ? "public" : "private")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="private">Private (join code)</option>
                    <option value="public">Public (open join)</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  Create Group
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Shield className="h-5 w-5" />
                 Join Group
               </CardTitle>
               <CardDescription>Enter a code or join an open group by id.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div className="space-y-2">
                   <div className="relative">
                     <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Join code (for private groups)"
                        className="pl-9"
                      />
                   </div>
                   <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground text-xs">ID</span>
                      <Input
                        value={joinGroupId}
                        onChange={(e) => setJoinGroupId(e.target.value)}
                        placeholder="Group id (for public groups)"
                        className="pl-9"
                      />
                   </div>
                </div>
                <Button type="submit" variant="secondary" className="w-full">
                  Join Group
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Globe className="h-5 w-5" />
               Discover Public Groups
             </CardTitle>
             <CardDescription>Search open groups by name or description.</CardDescription>
           </CardHeader>
           <CardContent>
              <form onSubmit={handlePublicSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={publicQuery}
                    onChange={(e) => setPublicQuery(e.target.value)}
                    placeholder="Search public groups..."
                    className="pl-9"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>

              {publicError && (
                <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive font-medium">
                  {publicError}
                </div>
              )}
              
              <div className="mt-6">
                {publicLoading ? (
                  <p className="text-muted-foreground">Searching public groups...</p>
                ) : publicQuery.trim().length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Start typing above to discover public groups.</p>
                  </div>
                ) : publicGroups.length === 0 ? (
                  <p className="text-muted-foreground">No public groups match that search.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {publicGroups.map((group) => (
                        <Card key={group.id} className="bg-muted/30">
                          <CardContent className="p-4">
                             <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <h3 className="font-semibold text-primary">{group.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{group.description || "No description"}</p>
                                <p className="text-xs text-muted-foreground mt-2">Teacher: <span className="font-medium">{group.teacherName || "Unknown"}</span></p>
                              </div>
                              <div className="shrink-0">
                                {group.isMember ? (
                                  <Link href={`/study-groups/${group.id}`}>
                                    <Button size="sm" variant="outline">Open</Button>
                                  </Link>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    onClick={() => void handleJoinPublicGroup(group.id)}
                                  >
                                    Join
                                  </Button>
                                )}
                              </div>
                             </div>
                             <div className="mt-3 flex gap-2">
                               <Badge variant="secondary" className="text-xs">Public</Badge>
                               {group.role && <Badge variant="outline" className="text-xs">{group.role}</Badge>}
                             </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Pagination
                      page={publicPage}
                      totalPages={publicTotalPages}
                      onPageChange={setPublicPage}
                    />
                  </div>
                )}
              </div>
           </CardContent>
        </Card>
      </section>
    </main>
  );
}
