"use client";

import React from "react";
import { useSession } from "next-auth/react";
import SkillTreeView from "@/app/components/skillTree/SkillTreeView";
import type {
  GetSkillTreeResponseDTO,
  GetSkillTreesResponseDTO,
  SkillTreeSummaryDTO,
  GetSkillTreeLeaderboardResponseDTO,
} from "@/types";
import { getSkillTree, getSkillTreeLeaderboard, getSkillTrees } from "@/services/skillTreeService";

const OfficialPage = () => {
  const { data: session, status } = useSession();
  const accessToken = session?.user?.accessToken;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [languages, setLanguages] = React.useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const [trees, setTrees] = React.useState<SkillTreeSummaryDTO[]>([]);
  const [selectedTreeId, setSelectedTreeId] = React.useState<number | null>(null);
  const [treeDetail, setTreeDetail] = React.useState<GetSkillTreeResponseDTO | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<GetSkillTreeLeaderboardResponseDTO | null>(null);
  const [overallProgress, setOverallProgress] = React.useState<GetSkillTreesResponseDTO["overallProgress"]>(null);

  const loadTrees = React.useCallback(
    async (language: string | null) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);

      try {
        const response = await getSkillTrees({ language }, accessToken);
        setLanguages(response.languages || []);
        setTrees(response.trees || []);
        setOverallProgress(response.overallProgress);

        if (!language && response.languages.length > 0) {
          setSelectedLanguage(response.languages[0]);
        }

        if (response.trees.length > 0) {
          setSelectedTreeId((prev) =>
            prev && response.trees.some((tree) => tree.id === prev) ? prev : response.trees[0].id
          );
        } else {
          setSelectedTreeId(null);
          setTreeDetail(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load skill trees");
      } finally {
        setLoading(false);
      }
    },
    [accessToken]
  );

  React.useEffect(() => {
    if (!accessToken) return;
    void loadTrees(selectedLanguage);
  }, [accessToken, loadTrees, selectedLanguage]);

  React.useEffect(() => {
    const loadDetail = async () => {
      if (!accessToken || !selectedTreeId) return;
      try {
        const response = await getSkillTree(selectedTreeId, accessToken);
        setTreeDetail(response);
        const lb = await getSkillTreeLeaderboard(selectedTreeId, accessToken);
        setLeaderboard(lb);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tree");
      }
    };
    void loadDetail();
  }, [accessToken, selectedTreeId]);

  React.useEffect(() => {
    if (!selectedTreeId) {
      setTreeDetail(null);
      setLeaderboard(null);
    }
  }, [selectedTreeId]);

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
        Please sign in to view the Official Skill Trees
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Official Skill Trees</h1>
            <p className="mt-2 text-slate-300">
              Progress through curated learning paths. Unlock nodes as you master official cards.
            </p>
          </div>

          {languages.length > 0 ? (
            <select
              value={selectedLanguage ?? ""}
              onChange={(event) => setSelectedLanguage(event.target.value || null)}
              className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2 text-sm"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 text-slate-300">
            Loading skill trees...
          </div>
        ) : trees.length === 0 ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 text-slate-300">
            No skill trees configured for this language yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-sm font-semibold text-slate-200">Language Progress</h2>
                <p className="mt-2 text-2xl font-semibold text-cyan-200">
                  {overallProgress?.progressPercent ?? 0}%
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {overallProgress?.completedNodes ?? 0}/{overallProgress?.totalNodes ?? 0} nodes completed
                </p>
                <p className="mt-1 text-xs text-slate-400">XP earned: {overallProgress?.xpEarned ?? 0}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-sm font-semibold text-slate-200">Trees</h2>
                <div className="mt-3 space-y-3">
                  {trees.map((tree) => (
                    <button
                      key={tree.id}
                      type="button"
                      onClick={() => setSelectedTreeId(tree.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selectedTreeId === tree.id
                          ? "border-cyan-400/60 bg-cyan-500/10"
                          : "border-white/10 bg-slate-900/40 hover:bg-slate-900/70"
                      }`}
                    >
                      <p className="font-semibold text-cyan-100">{tree.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{tree.progressPercent}% complete</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {tree.completedNodes}/{tree.totalNodes} nodes
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              {treeDetail?.tree ? <SkillTreeView tree={treeDetail.tree} /> : null}

              {leaderboard ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-semibold">Leaderboard</h2>
                  <p className="text-xs text-slate-400">Top learners in this tree</p>
                  <div className="mt-4 space-y-2">
                    {leaderboard.entries.length ? (
                      leaderboard.entries.map((entry, index) => (
                        <div
                          key={entry.userId}
                          className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">#{index + 1}</span>
                            <span className="font-semibold text-slate-100">{entry.username}</span>
                          </div>
                          <span className="text-cyan-200">{entry.xpEarned} XP</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No leaderboard data yet.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default OfficialPage;