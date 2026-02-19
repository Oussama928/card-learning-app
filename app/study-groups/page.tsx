"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { CreateStudyGroupRequestDTO, JoinStudyGroupRequestDTO, StudyGroupDTO } from "@/types";
import { createStudyGroup, getStudyGroups, joinStudyGroup } from "@/services/studyGroupService";

export default function StudyGroupsPage() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = React.useState<StudyGroupDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleCreateGroup} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold text-cyan-200">Create Group</h2>
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
          <h2 className="text-xl font-semibold">Your Groups</h2>
          {loading ? (
            <p className="mt-4 text-slate-300">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="mt-4 text-slate-300">No groups yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {groups.map((group) => (
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
          )}
        </div>
      </section>
    </main>
  );
}
