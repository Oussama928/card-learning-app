"use client";

import React from "react";
import { PaperClipIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";
import { profileUpdateSchema } from "@/types/validationSchemas";
import PerformanceHeatmap from "./PerformanceHeatmap";
import type { AchievementBadgeDTO, ProfileStatsDTO } from "@/types";

import { FaEdit, FaInfoCircle } from "react-icons/fa";

interface ProfileProps {
  id?: string;
}

//update the other parts later (the ones besides stats)
export default function Profile({ id }: ProfileProps) {
  const { data: session, update } = useSession();
  const [stats, setStats] = React.useState<ProfileStatsDTO | null>(null);
  const [edited, setEdited] = React.useState("");
  const [streakInfo, setStreakInfo] = React.useState(false);
  const [tierInfo, setTierInfo] = React.useState(false);
  const [editIndex, setEditIndex] = React.useState([
    false,
    false,
    false,
    false,
    false,
  ]);
  const countries = ["United States", "Germany", "Japan", "Canada"];

  React.useEffect(() => {
    const getStats = async () => {
      let idd = session?.user?.id;
      if (id) {
        idd = id;
      }
      try {
        if (!session) return;
        const res = await fetch(`/api/getStats/${idd}`);
        const data = await res.json();
        setStats(data.stats as ProfileStatsDTO);
        console.log("here here bro : ", data);
      } catch (err) {
        console.error(err);
      }
    };

    getStats();
  }, [session]);

  const handleSubmit = async (field: "bio" | "country" | "username") => {
    // Basic validation before submitting
    if (!edited.trim()) {
      alert("Field cannot be empty");
      return;
    }

    if (field === "username") {
      try {
        await profileUpdateSchema.validateAt("username", { username: edited });
      } catch (error: unknown) {
        alert(error.message);
        return;
      }
    } else if (field === "country") {
      try {
        await profileUpdateSchema.validateAt("country", { country: edited });
      } catch (error: unknown) {
        alert(error.message);
        return;
      }
    } else if (field === "bio") {
      try {
        await profileUpdateSchema.validateAt("bio", { bio: edited });
      } catch (error: unknown) {
        alert(error.message);
        return;
      }
    }

    const updateField = async (field: "bio" | "country" | "username") => {
      try {
        if (!session?.user?.accessToken) return;
        const res = await fetch(`/api/updateInfos/profile`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ field: field, value: edited }),
        });
        const data = await res.json();
        console.log(data);
        setEditIndex([false, false, false, false, false]);

        if (field === "username") {
          console.log("Updating username to:", edited);
          await update({
            ...session,
            user: {
              ...session.user,
              name: edited,
            },
          });
          console.log("Session after update:", session);
        }
        setEdited("");
      } catch (err) {
        console.log(err);
      }
    };
    if (field == "bio" || field == "country" || field == "username") {
      updateField(field);
      field == "country" && setStats((prev) => ({ ...(prev ?? {}), country: edited }));
      field == "bio" && setStats((prev) => ({ ...(prev ?? {}), bio: edited }));
    }
  };

  if (!session || !stats) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="w-1/4 aspect-square border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full min-h-screen pt-20 relative bg-background text-foreground">
      <div className="px-4 sm:px-0 mb-8">
        <h3 className="text-2xl font-bold text-primary">
          User Profile
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Personal details and account information
        </p>
      </div>

      <div className="mt-6 border-t border-border">
        <dl className="divide-y divide-border">
          {[
            { label: "Username", value: stats?.username },

            { label: "Email address", value: stats?.email },
            { label: "Country", value: stats?.country },

            { label: "Learning Streak", value: `${stats?.dailyStreak} days` },
          ].map((item, idx) => (
            <div
              key={idx}
              className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 hover:bg-muted/50 transition-colors rounded-lg justify-center items-center"
            >
              <dt className="text-sm font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0 flex text-foreground">
                {editIndex[idx] && !id ? (
                  idx === 2 ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="bg-background border border-input text-foreground p-2 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                        onChange={(e) => setEdited(e.target.value)}
                        value={edited}
                      >
                        {countries.map((country, index) => (
                          <option key={index} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSubmit("country")}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        submit
                      </button>
                    </div>
                  ) : id ? ( // Fixed conditional rendering for `id`
                    <div className="flex items-center gap-2">
                      <input
                        onChange={(e) => setEdited(e.target.value)}
                        value={edited}
                        type="text"
                        className="w-full bg-background border border-input text-foreground p-2 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder={`Enter ${item.label.toLowerCase()}`}
                      />
                      <button
                        onClick={() => handleSubmit("username")}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        submit
                      </button>
                    </div>
                  ) : null
                ) : (
                  <>
                    <div className="justify-center text-center flex items-center">
                      {item.value}
                    </div>
                    {(idx === 0 || idx === 2) && !id && (
                      <FaEdit
                        onClick={() =>
                          setEditIndex((prev) =>
                            prev.map((_, i) => (i === idx ? true : false))
                          )
                        }
                        className="cursor-pointer ml-5 text-muted-foreground hover:text-primary transition-colors"
                      />
                    )}
                    {idx === 3 && (
                      <div className="flex items-center gap-2">
                        <img src="/flame.png" className="h-7 w-7 ml-5" />
                        <FaInfoCircle
                          onClick={() => setStreakInfo(true)}
                          className="ml-12 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        />
                      </div>
                    )}
                  </>
                )}
              </dd>
            </div>
          ))}

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 hover:bg-muted/50 transition-colors rounded-lg">
            <dt className="text-sm font-medium text-muted-foreground">
              Bio
            </dt>
            <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0 text-foreground">
              <div className="space-y-4">
                <p>
                  {editIndex[4] && !id ? (
                    <div className="flex flex-col gap-2 items-start">
                      <textarea
                        className="w-full h-20 bg-background border border-input text-foreground p-2 rounded-md focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                        placeholder="Write a short bio about yourself"
                        onChange={(e) => setEdited(e.target.value)}
                        value={edited}
                      ></textarea>
                      <button
                        onClick={() => handleSubmit("bio")}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        submit
                      </button>
                    </div>
                  ) : stats?.bio == null && editIndex[4] === false && !id ? (
                    <button
                      className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                      onClick={() =>
                        setEditIndex((prev) =>
                          prev.map((val, i) => (i === 4 ? true : val))
                        )
                      }
                    >
                      add bio
                    </button>
                  ) : (
                    stats?.bio &&
                    !id &&
                    editIndex[4] === false && (
                      <div className="flex items-center">
                        {stats?.bio}
                        <FaEdit
                          onClick={() =>
                            setEditIndex((prev) =>
                              prev.map((val, i) => (i === 4 ? true : val))
                            )
                          }
                          className="cursor-pointer ml-5 text-muted-foreground hover:text-primary transition-colors"
                        />
                      </div>
                    )
                  )}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <PaperClipIcon className="h-5 w-5 flex-none text-primary" />
                  <span className="text-primary hover:underline cursor-pointer">
                    lang_learner_achievements.pdf
                  </span>
                </div>
              </div>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "daily Streak", value: stats?.dailyStreak, unit: "days" },
          {
            label: "total Terms Learned",
            value: stats?.totalTermsLearned,
            unit: "words",
          },
          { label: "accuracy", value: stats?.accuracy, unit: "%" },
          { label: "xp", value: stats?.xp, unit: "points" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl text-center bg-card border border-border shadow-sm"
          >
            <div className="text-2xl font-bold text-primary">
              {stat.value} <span className="text-lg font-medium text-muted-foreground">{stat.unit}</span>
            </div>
            <div className="text-sm mt-1 text-muted-foreground capitalize">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <PerformanceHeatmap activityHeatmap={stats?.activityHeatmap} />

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl p-6 bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-primary flex items-center">
              Tier Progression
              <img
                src={`/tiers/${stats.progression?.currentXp >= 12000 ? "godlike" : stats.progression?.currentXp >= 8000 ? "legendary" : stats.progression?.currentXp >= 5000 ? "titanium" : stats.progression?.currentXp >= 3000 ? "platinum" : stats.progression?.currentXp >= 1500 ? "gold" : stats.progression?.currentXp >= 500 ? "silver" : "bronze"}.png`}
                alt={stats.progression?.currentTier?.name ?? "tier icon"}
                className="ml-3 inline-block w-8 h-8"
              />
            </h4>
            <FaInfoCircle
              onClick={() => setTierInfo(true)}
              className="text-muted-foreground hover:text-primary cursor-pointer transition-colors"
            />
          </div>
          <div className="space-y-3 text-sm text-foreground">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Current tier</span>
              <span className="font-semibold">{stats.progression?.currentTier?.name ?? "Bronze"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Current XP</span>
              <span className="font-semibold">{stats.progression?.currentXp ?? 0}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground">Percentile ranking</span>
              <span className="font-semibold">{stats.progression?.percentileRanking ?? 0}%</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Next unlock</span>
              <span className="font-semibold text-right">
                {stats.progression?.nextUnlock
                  ? `${stats.progression.nextUnlock.tier.name} (${stats.progression.nextUnlock.xpRemaining} XP left)`
                  : "Max tier reached"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6 bg-card border border-border shadow-sm">
          <h4 className="text-lg font-semibold mb-4 text-primary">
            Achievement Badges
          </h4>

          {(stats.achievements || []).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No badges available yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(stats.achievements || []).map((badge: AchievementBadgeDTO) => (
                <div
                  key={badge.key}
                  className={`rounded-lg p-3 border transition-colors ${
                    badge.unlocked 
                      ? "bg-primary/5 border-primary/30" 
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {badge.imageUrl ? (
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className={`w-10 h-10 rounded-md object-cover flex-shrink-0 ${!badge.unlocked && "grayscale opacity-50"}`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        badge.unlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {badge.name.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${badge.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                        {badge.name}
                      </div>
                      <div className="text-xs mt-1 text-muted-foreground line-clamp-2" title={badge.description}>
                        {badge.description}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-[10px] font-medium text-muted-foreground">
                          {Math.min(badge.progress, badge.target)} / {badge.target}
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${badge.unlocked ? "text-primary" : "text-muted-foreground"}`}>
                          {badge.unlocked ? "Unlocked" : "Locked"}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${badge.unlocked ? "bg-primary" : "bg-primary/40"}`}
                          style={{ width: `${Math.min(100, (badge.progress / badge.target) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {streakInfo && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm px-4 z-50">
          <div className="p-8 rounded-xl max-w-lg w-full bg-card border border-border shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-center text-primary">
              Streak Milestones
            </h3>
            <div className="flex items-center justify-center gap-8 mt-5">
              {[
                { src: "/flame.png", days: "1 Day" },
                { src: "/flame1.png", days: "7 Days" },
                { src: "/flame2.png", days: "30 Days" },
                { src: "/flame3.png", days: "100 Days" },
              ].map((flame, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <img
                    src={flame.src}
                    alt={`${flame.days} streak`}
                    className="w-12 h-12 drop-shadow-md"
                  />
                  <span className="mt-3 text-sm font-medium text-foreground">
                    {flame.days}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Each flame represents a streak milestone: the first for 1 day, the
              second for 7 days, the third for 30 days, and the fourth for 100
              days. Keep learning every day to upgrade your flame!
            </p>
            <button
              onClick={() => setStreakInfo(false)}
              className="mt-8 w-full py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {tierInfo && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm px-4 z-50">
          <div className="p-8 rounded-xl max-w-lg w-full bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-center text-primary">
              Tier Requirements
            </h3>
            <div className="space-y-3">
              {[
                { name: "Bronze", xp: 0, img: "/tiers/bronze.png" },
                { name: "Silver", xp: 500, img: "/tiers/silver.png" },
                { name: "Gold", xp: 1500, img: "/tiers/gold.png" },
                { name: "Platinum", xp: 3000, img: "/tiers/platinum.png" },
                { name: "Titanium", xp: 5000, img: "/tiers/titanium.png" },
                { name: "Legendary", xp: 8000, img: "/tiers/legendary.png" },
                { name: "Godlike", xp: 12000, img: "/tiers/godlike.png" },
              ].sort((a, b) => a.xp - b.xp).map((tier, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={tier.img}
                      alt={tier.name}
                      className="w-10 h-10 rounded-full drop-shadow-sm"
                    />
                    <span className="font-semibold text-foreground">
                      {tier.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {tier.xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground leading-relaxed">
              Earn XP by completing reviews and learning new words to rank up
              through the tiers and unlock exclusive achievements.
            </p>
            <button
              onClick={() => setTierInfo(false)}
              className="mt-8 w-full py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
