"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

const Settings = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [studyMode, setStudyMode] = React.useState("default");
  const [loading, setLoading] = React.useState(true);
  const [saved, setSaved] = React.useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    const fetchPreferences = async () => {
      try {
        const res = await fetch("/api/userPreferences", {
          headers: {
            authorization: `Bearer ${session.user?.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setStudyMode(data.study_mode || "default");
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [session, router]);

  const handleSavePreferences = async () => {
    try {
      const res = await fetch("/api/userPreferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify({ study_mode: studyMode }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-24 pb-12 px-4"
      style={{
        background: "linear-gradient(145deg, #1e2b3a 0%, #2a3f54 100%)",
        color: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-lg text-teal-300" />
          </button>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Settings
          </h1>
        </div>

        {/* Study Mode Preference Card */}
        <div
          className="rounded-xl p-8 mb-8 border"
          style={{
            background: "linear-gradient(145deg, #2a3f54 0%, #1e2b3a 100%)",
            borderColor: "rgba(127,202,201,0.2)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          <h2
            className="text-2xl font-bold mb-2 text-teal-200"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Study Mode
          </h2>
          <p className="text-gray-300 mb-6">
            Choose how you want to study your cards
          </p>

          <div className="space-y-4">
            {/* Default Mode Option */}
            <div
              className={`p-5 rounded-lg border-2 transition cursor-pointer ${
                studyMode === "default"
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-gray-600 bg-gray-800/30 hover:border-gray-500"
              }`}
              onClick={() => setStudyMode("default")}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <input
                    type="radio"
                    name="study_mode"
                    value="default"
                    checked={studyMode === "default"}
                    onChange={(e) => setStudyMode(e.target.value)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Default Mode</h3>
                  <p className="text-sm text-gray-400">
                    Study all cards in order. Perfect for sequential learning or reviewing all terms at once.
                  </p>
                </div>
              </div>
            </div>

            {/* Spaced Repetition Mode Option */}
            <div
              className={`p-5 rounded-lg border-2 transition cursor-pointer ${
                studyMode === "spaced_repetition"
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-gray-600 bg-gray-800/30 hover:border-gray-500"
              }`}
              onClick={() => setStudyMode("spaced_repetition")}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <input
                    type="radio"
                    name="study_mode"
                    value="spaced_repetition"
                    checked={studyMode === "spaced_repetition"}
                    onChange={(e) => setStudyMode(e.target.value)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Spaced Repetition</h3>
                  <p className="text-sm text-gray-400">
                    Adaptive learning algorithm that prioritizes cards based on your performance. Shows due cards first and requeues based on correctness.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleSavePreferences}
              className="px-8 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold transition duration-200 shadow-md"
            >
              Save Preferences
            </button>
            {saved && (
              <span className="text-green-400 text-sm font-medium">✓ Saved successfully</span>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Settings;
