"use client";

import React from "react";
import Link from "next/link";
import type { HomeOverviewDTO, HomeDashboardProps } from "@/types";

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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-cyan-200/90">Welcome</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Hey {welcomeName} </h1>
        <p className="mt-4 text-slate-300">Let&apos;s keep your momentum going.</p>

        {loading ? (
          <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6 text-slate-300">
            Loading your learning plan...
          </div>
        ) : overview && (overview.unfinishedSessions.length > 0 || overview.completedSessions.length > 0) ? (
          <>
            {overview.unfinishedSessions.length > 0 ? (
          <div className="mt-10 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-6">
            <h2 className="text-2xl font-semibold text-cyan-200">Continue where you left off</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {overview.unfinishedSessions.map((item) => (
                <Link
                  key={`continue-${item.id}`}
                  href={`/learning/${item.id}`}
                  className="rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                >
                  <p className="font-semibold text-cyan-100">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {item.learnedWords}/{item.totalWords} words done • {item.targetLanguage}
                  </p>
                  {item.description ? (
                    <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
            ) : null}

            {overview.completedSessions.length > 0 ? (
          <div className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-6">
            <h2 className="text-2xl font-semibold text-amber-200">Try redoing these</h2>
            <p className="mt-2 text-sm text-slate-300">Recent completed sessions.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {overview.completedSessions.map((item) => (
                <Link
                  key={`redo-${item.id}`}
                  href={`/learning/${item.id}`}
                  className="rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                >
                  <p className="font-semibold text-amber-100">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Completed {item.learnedWords}/{item.totalWords} words • {item.targetLanguage}
                  </p>
                </Link>
              ))}
            </div>
          </div>
            ) : null}
          </>
        ) : (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">You&apos;re all caught up</h2>
            <p className="mt-2 text-slate-300">Pick a deck and start a fresh round.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/official" className="rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-slate-900">
                Browse official cards
              </Link>
              <Link href="/community" className="rounded-lg border border-slate-400 px-4 py-2 font-semibold text-slate-100">
                Browse community cards
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
