"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Monitor,
  Moon,
  Sun,
  Save,
  Loader2,
  CheckCircle2,
  Palette,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [studyMode, setStudyMode] = React.useState("default");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const fetchPreferences = async () => {
        try {
          const res = await fetch("/api/userPreferences", {
            headers: {
              authorization: `Bearer ${session?.user?.accessToken}`,
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
    }
  }, [status, router, session]);

  const handleSavePreferences = async () => {
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground py-12 px-4"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Learning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Theme Preferences</CardTitle>
                  <CardDescription>
                    Customize how the application looks for you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
                        theme === "light"
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30"
                      )}
                    >
                      <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                        <Sun className="h-6 w-6" />
                      </div>
                      <span className="font-medium">Light</span>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
                        theme === "dark"
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30"
                      )}
                    >
                      <div className="p-3 rounded-full bg-slate-800 text-slate-100">
                        <Moon className="h-6 w-6" />
                      </div>
                      <span className="font-medium">Dark</span>
                    </button>

                    <button
                      onClick={() => setTheme("dim")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
                        theme === "dim"
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30"
                      )}
                    >
                      <div className="p-3 rounded-full bg-zinc-800 text-zinc-400">
                        <Monitor className="h-6 w-6" />
                      </div>
                      <span className="font-medium">Dim</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="learning">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Learning Preferences</CardTitle>
                  <CardDescription>
                    Adjust your study environment and habits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base">Study Mode</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        onClick={() => setStudyMode("default")}
                        className={cn(
                          "cursor-pointer p-4 rounded-lg border-2 transition-all",
                          studyMode === "default"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <h3 className="font-semibold">Standard Mode</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Study all cards in order. Perfect for sequential
                          learning or reviewing all terms at once.
                        </p>
                      </div>

                      <div
                        onClick={() => setStudyMode("spaced_repetition")}
                        className={cn(
                          "cursor-pointer p-4 rounded-lg border-2 transition-all",
                          studyMode === "spaced_repetition"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <h3 className="font-semibold">Spaced Repetition</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Adaptive learning algorithm that prioritizes cards
                          based on your performance.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="ml-auto min-w-[120px]"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : saved ? (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
