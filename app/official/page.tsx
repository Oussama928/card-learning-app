"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Loader2, 
  AlertCircle, 
  Map as MapIcon, 
  Trophy, 
  BarChart, 
  ChevronRight,
  Globe
} from "lucide-react";

import SkillTreeView from "@/app/components/skillTree/SkillTreeView";
import type {
  GetSkillTreeResponseDTO,
  GetSkillTreesResponseDTO,
  SkillTreeSummaryDTO,
  GetSkillTreeLeaderboardResponseDTO,
} from "@/types";
import { getSkillTree, getSkillTreeLeaderboard, getSkillTrees } from "@/services/skillTreeService";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-destructive p-4">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-2" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please sign in to view the Official Skill Trees
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground py-14 px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Official Skill Trees</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Progress through curated learning paths. Unlock nodes as you master official cards.
            </p>
          </div>

          {languages.length > 0 && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedLanguage ?? ""}
                onChange={(event) => setSelectedLanguage(event.target.value || null)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : trees.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MapIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No skill trees configured for this language yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    Language Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {overallProgress?.progressPercent ?? 0}%
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>Nodes</span>
                      <span>{overallProgress?.completedNodes ?? 0}/{overallProgress?.totalNodes ?? 0}</span>
                    </p>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${overallProgress?.progressPercent ?? 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      XP earned: {overallProgress?.xpEarned ?? 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trees List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapIcon className="h-4 w-4" />
                    Available Trees
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {trees.map((tree) => (
                      <button
                        key={tree.id}
                        type="button"
                        onClick={() => setSelectedTreeId(tree.id)}
                        className={cn(
                          "w-full rounded-lg px-3 py-3 text-left transition-all text-sm group flex items-center justify-between",
                          selectedTreeId === tree.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex-1">
                          <p className={cn(
                             "transition-colors",
                             selectedTreeId === tree.id ? "text-primary" : "text-foreground"
                          )}>
                            {tree.name}
                          </p>
                          <p className="text-xs opacity-70 mt-0.5">
                            {tree.completedNodes}/{tree.totalNodes} nodes
                          </p>
                        </div>
                        {selectedTreeId === tree.id && (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="space-y-8">
              {treeDetail?.tree && (
                <motion.div
                  key={selectedTreeId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden border-2 border-border/50 shadow-sm">
                    <div className="p-6">
                       <SkillTreeView tree={treeDetail.tree} />
                    </div>
                  </Card>
                </motion.div>
              )}

              {leaderboard && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          Leaderboard
                        </CardTitle>
                        <CardDescription>Top learners in this tree</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {leaderboard.entries.length > 0 ? (
                          leaderboard.entries.map((entry, index) => (
                            <div
                              key={entry.userId}
                              className={cn(
                                "flex items-center justify-between rounded-lg p-3 text-sm transition-colors",
                                index === 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted/40"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <span className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                  index === 0 ? "bg-yellow-500 text-yellow-950" :
                                  index === 1 ? "bg-zinc-400 text-zinc-900" :
                                  index === 2 ? "bg-amber-700 text-amber-100" :
                                  "bg-muted text-muted-foreground"
                                )}>
                                  {index + 1}
                                </span>
                                <span className="font-medium text-foreground">{entry.username}</span>
                              </div>
                              <span className="font-semibold text-primary">{entry.xpEarned} XP</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground text-sm">
                            No leaderboard data yet. Be the first!
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.main>
  );
};

export default OfficialPage;