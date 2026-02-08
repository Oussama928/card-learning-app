"use client";

import React from "react";
import Image from "next/image";
import { TrophyIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";

export default function GlobalStats() {
  const [topUsers, setTopUsers] = React.useState([]);
  const { data: session } = useSession();

  React.useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const res = await fetch("/api/getGlobalStats", {
          method: "GET",
          headers: {
            authorization: `Bearer ${session?.user?.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setTopUsers((prev)=>data.topXpResult);
        console.log(topUsers);
      } catch (err) {
        console.error("Failed to fetch global stats:", err);
      }
    };
    if (session) {
      fetchTopUsers();
    }
  }, [session]);

  if (!topUsers.length) {
    return <div className="text-gray-300 p-8">Loading top users...</div>;
  }

  return (
    <div
      className="p-8 w-full min-h-screen pt-20"
      style={{
        background: "linear-gradient(145deg, #1e2b3a 0%, #2a3f54 100%)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <div className="px-4 sm:px-0 mb-8">
        <h3 className="text-2xl font-bold" style={{ color: "#7fcac9" }}>
          Global Leaderboard
        </h3>
        <p
          className="mt-2 text-sm opacity-80"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Top 10 users by XP
        </p>
      </div>

      <div className="mt-6">
        <div className="space-y-4">
          {topUsers.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors"
              style={{
                background: "rgba(127,202,201,0.1)",
                border: "1px solid rgba(127,202,201,0.2)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: "rgba(127,202,201,0.2)" }}
                >
                  <TrophyIcon
                    className="h-5 w-5"
                    style={{ color: index < 3 ? "#ffd700" : "#7fcac9" }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Image
                    src={user.image || "/default-avatar.png"}
                    alt={user.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {user.username}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      ID: {user.id}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold" style={{ color: "#7fcac9" }}>
                {user.xp || 0} XP
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
