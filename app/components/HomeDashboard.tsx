"use client";

import React from "react";
import Link from "next/link";
import type { HomeOverviewDTO, HomeDashboardProps } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, BookOpen, RefreshCw } from "lucide-react";

export default function HomeDashboard({ accessToken, userName }: HomeDashboardProps) {
  const [overview, setOverview] = React.useState<HomeOverviewDTO | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOverview = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/home/overview", {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch home overview");
        }

        const data = await response.json();
        setOverview(data.overview as HomeOverviewDTO);
      } catch {
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchOverview();
  }, [accessToken]);

  const welcomeName = userName?.trim() || "there";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-primary">Welcome</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Hey {welcomeName}</h1>
        <p className="mt-4 text-muted-foreground text-lg">Let&apos;s keep your momentum going.</p>

        {loading ? (
          <div className="mt-10 space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : overview && (overview.unfinishedSessions.length > 0 || overview.completedSessions.length > 0) ? (
          <div className="mt-10 space-y-8">
            {overview.unfinishedSessions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold tracking-tight">Continue where you left off</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {overview.unfinishedSessions.map((item) => (
                    <Link key={`continue-${item.id}`} href={`/learning/${item.id}`}>
                      <Card className="h-full transition-colors hover:bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription>
                            {item.learnedWords}/{item.totalWords} words done • {item.targetLanguage}
                          </CardDescription>
                        </CardHeader>
                        {item.description && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {overview.completedSessions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-amber-500" />
                  <h2 className="text-2xl font-semibold tracking-tight">Try redoing these</h2>
                </div>
                <p className="text-sm text-muted-foreground">Recent completed sessions.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {overview.completedSessions.map((item) => (
                    <Link key={`redo-${item.id}`} href={`/learning/${item.id}`}>
                      <Card className="h-full transition-colors hover:bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <CardDescription>
                            Completed {item.learnedWords}/{item.totalWords} words • {item.targetLanguage}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>You&apos;re all caught up</CardTitle>
              <CardDescription>Pick a deck and start a fresh round.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/official">
                  Browse official cards
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/community">
                  Browse community cards
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
