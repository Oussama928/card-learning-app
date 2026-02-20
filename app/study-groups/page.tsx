"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-4xl font-bold">Study Groups</h1>
        <p className="mt-2 text-slate-300">Create classes, invite students, and collaborate with announcements.</p>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        ) : null}

        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Your Groups</h2>
              <p className="text-sm text-slate-300">Quick access to classes you teach or attend.</p>
            </div>
          </div>
          {loading ? (
            <p className="mt-4 text-slate-300">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="mt-4 text-slate-300">No groups yet.</p>
          ) : (
            <div className="mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {pagedGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/study-groups/${group.id}`}
                    className="rounded-lg border border-white/10 bg-slate-900/50 p-4 hover:bg-slate-900"
                  >
                    <p className="text-lg font-semibold text-cyan-100">{group.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{group.description || "No description"}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-700 px-2 py-1 uppercase">{group.role}</span>
                      <span className="rounded-full bg-slate-700 px-2 py-1 uppercase">{group.visibility}</span>
                      {group.role === "teacher" && group.joinCode ? (
                        <span className="rounded-full bg-cyan-900/60 px-2 py-1">Code: {group.joinCode}</span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="mt-6"
              />
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleCreateGroup} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold text-cyan-200">Create Group</h2>
            <p className="mt-1 text-sm text-slate-300">Start a private or public learning space.</p>
            <div className="mt-4 space-y-3">
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
              />
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Description"
                className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
              />
              <select
                value={createVisibility}
                onChange={(e) => setCreateVisibility(e.target.value === "public" ? "public" : "private")}
                className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
              >
                <option value="private">Private (join code)</option>
                <option value="public">Public (open join)</option>
              </select>
              <button type="submit" className="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-900">
                Create
              </button>
            </div>
          </form>

          <form onSubmit={handleJoinGroup} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold text-amber-200">Join Group</h2>
            <p className="mt-1 text-sm text-slate-300">Enter a code or join an open group by id.</p>
            <div className="mt-4 space-y-3">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Join code (for private groups)"
                className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
              />
              <input
                value={joinGroupId}
                onChange={(e) => setJoinGroupId(e.target.value)}
                placeholder="Group id (for public groups)"
                className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
              />
              <button type="submit" className="rounded-md bg-amber-300 px-4 py-2 font-semibold text-slate-900">
                Join
              </button>
            </div>
          </form>
        </div>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Discover Public Groups</h2>
              <p className="text-sm text-slate-300">Search open groups by name or description.</p>
            </div>
          </div>

          <form onSubmit={handlePublicSearch} className="mt-4 flex flex-wrap gap-3">
            <input
              value={publicQuery}
              onChange={(e) => setPublicQuery(e.target.value)}
              placeholder="Search public groups"
              className="flex-1 rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
            />
            <button type="submit" className="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-900">
              Search
            </button>
          </form>

          {publicError ? (
            <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
              {publicError}
            </div>
          ) : null}

          {publicLoading ? (
            <p className="mt-4 text-slate-300">Searching public groups...</p>
          ) : publicQuery.trim().length === 0 ? (
            <p className="mt-4 text-slate-300">Start typing to discover public groups.</p>
          ) : publicGroups.length === 0 ? (
            <p className="mt-4 text-slate-300">No public groups match that search.</p>
          ) : (
            <div className="mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {publicGroups.map((group) => (
                  <div key={group.id} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-cyan-100">{group.name}</p>
                        <p className="mt-1 text-sm text-slate-300">{group.description || "No description"}</p>
                        <p className="mt-2 text-xs text-slate-400">Teacher: {group.teacherName || "Unknown"}</p>
                      </div>
                      {group.isMember ? (
                        <Link
                          href={`/study-groups/${group.id}`}
                          className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold"
                        >
                          Open
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleJoinPublicGroup(group.id)}
                          className="rounded-md bg-amber-300 px-3 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          Join
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-700 px-2 py-1 uppercase">public</span>
                      {group.role ? (
                        <span className="rounded-full bg-slate-700 px-2 py-1 uppercase">{group.role}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={publicPage}
                totalPages={publicTotalPages}
                onPageChange={setPublicPage}
                className="mt-6"
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
