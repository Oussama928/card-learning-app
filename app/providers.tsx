"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { AuthStateProvider } from "./context/AuthStateContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem themes={["light", "dark", "dim"]}>
        <AuthStateProvider>
          <AppSettingsProvider>{children}</AppSettingsProvider>
        </AuthStateProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
