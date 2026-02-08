"use client";

import React from "react";
import { PaperClipIcon } from "@heroicons/react/20/solid";
import { useSession, updateSession } from "next-auth/react";

import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";

//update the other parts later (the ones besides stats)
export default function Profile({ id }) {
  const { data: session, update } = useSession();
  const [stats, setStats] = React.useState("");
  const [edited, setEdited] = React.useState("");
  const [country, setCountry] = React.useState(null);
  const [streakInfo, setStreakInfo] = React.useState(false);
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
        setStats(data.stats);
        console.log("here here bro : ", data);
      } catch (err) {
        console.error(err);
      }
    };

    getStats();
  }, [session]);

  const handleSubmit = async (field) => {
    const updateField = async (field) => {
      try {
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
      field == "country" && setStats((prev) => ({ ...prev, country: edited }));
      field == "bio" && setStats((prev) => ({ ...prev, bio: edited }));
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
    <div
      className=" p-8 w-full min-h-screen pt-20 relative"
      style={{
        background: "linear-gradient(145deg, #1e2b3a 0%, #2a3f54 100%)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <div className="px-4 sm:px-0 mb-8">
        <h3 className="text-2xl font-bold" style={{ color: "#7fcac9" }}>
          User Profile
        </h3>
        <p
          className="mt-2 text-sm opacity-80"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Personal details and account information
        </p>
      </div>

      <div
        className="mt-6 border-t"
        style={{ borderColor: "rgba(127,202,201,0.1)" }}
      >
        <dl className="" style={{ borderColor: "rgba(127,202,201,0.1)" }}>
          {[
            { label: "Username", value: stats?.username },

            { label: "Email address", value: stats?.email },
            { label: "Country", value: stats?.country },

            { label: "Learning Streak", value: `${stats?.dailyStreak} days` },
          ].map((item, idx) => (
            <div
              key={idx}
              className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 hover:bg-white/5 transition-colors rounded-lg justify-center items-center"
            >
              <dt
                className="text-sm font-medium "
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                {item.label}
              </dt>
              <dd
                className="mt-1 text-sm sm:col-span-2 sm:mt-0 flex"
                style={{ color: "#7fcac9" }}
              >
                {editIndex[idx] && !id ? (
                  idx === 2 ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="text-black p-2 rounded-lg"
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
                        onClick={() => handleSubmit(item.label.toLowerCase())}
                        className="bg-black px-2 rounded-full"
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
                        className="w-full text-black p-2 rounded-lg"
                        placeholder={`Enter ${item.label.toLowerCase()}`}
                      />
                      <button
                        onClick={() => handleSubmit(item.label.toLowerCase())}
                        className="bg-black px-2 rounded-full"
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
                      <EditIcon
                        onClick={() =>
                          setEditIndex((prev) =>
                            prev.map((_, i) => (i === idx ? true : false))
                          )
                        }
                        className="cursor-pointer ml-5"
                      />
                    )}
                    {idx === 3 && (
                      <div className="flex items-center gap-2">
                        <img src="/flame.png" className="h-7 w-7 ml-5" />
                        <InfoIcon
                          onClick={() => setStreakInfo(true)}
                          className="ml-12 opacity-45 cursor-pointer"
                        />
                      </div>
                    )}
                  </>
                )}
              </dd>
            </div>
          ))}

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Bio
            </dt>
            <dd
              className="mt-1 text-sm sm:col-span-2 sm:mt-0"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              <div className="space-y-4">
                <p>
                  {editIndex[4] && !id ? (
                    <>
                      <textarea
                        className="w-full h-20 text-black p-2 rounded-lg"
                        placeholder="Write a short bio about yourself"
                        onChange={(e) => setEdited(e.target.value)}
                        value={edited}
                      ></textarea>
                      <button
                        onClick={() => handleSubmit("bio")}
                        className="bg-black px-2 rounded-full"
                      >
                        submit
                      </button>
                    </>
                  ) : stats?.bio == null && editIndex[4] === false && !id ? (
                    <button
                      className="bg-black px-2 rounded-full"
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
                      <>
                        {stats?.bio}
                        <EditIcon
                          onClick={() =>
                            setEditIndex((prev) =>
                              prev.map((val, i) => (i === 4 ? true : val))
                            )
                          }
                          className="cursor-pointer ml-5"
                        />
                      </>
                    )
                  )}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <PaperClipIcon
                    className="h-5 w-5 flex-none"
                    style={{ color: "#7fcac9" }}
                  />
                  <span style={{ color: "#7fcac9" }}>
                    lang_learner_achievements.pdf
                  </span>
                </div>
              </div>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-24 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            className="p-4 rounded-lg text-center"
            style={{
              background: "rgba(127,202,201,0.1)",
              border: "1px solid rgba(127,202,201,0.2)",
            }}
          >
            <div style={{ color: "#7fcac9" }} className="text-2xl font-bold">
              {stat.value} {stat.unit}
            </div>
            <div
              style={{ color: "rgba(255,255,255,0.7)" }}
              className="text-sm mt-1"
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      {streakInfo && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          style={{ zIndex: 1000 }}
        >
          <div
            className="p-8 rounded-lg"
            style={{
              background: "linear-gradient(145deg, #1e2b3a 0%, #2a3f54 100%)",
              border: "1px solid rgba(127,202,201,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: "#7fcac9" }}
            >
              Streak Milestones
            </h3>
            <div className="flex  items-center justify-center gap-8 mt-5">
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
                    className="w-12 h-12"
                  />
                  <span
                    className="mt-2 text-sm"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {flame.days}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="mt-6 text-center text-sm max-w-md"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Each flame represents a streak milestone: the first for 1 day, the
              second for 7 days, the third for 30 days, and the fourth for 100
              days.
            </p>
            <button
              onClick={() => setStreakInfo(false)}
              className="mt-6 w-full py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: "rgba(127,202,201,0.1)",
                color: "#7fcac9",
                border: "1px solid rgba(127,202,201,0.2)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
