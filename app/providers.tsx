"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { AuthStateProvider } from "./context/AuthStateContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthStateProvider>
        <AppSettingsProvider>{children}</AppSettingsProvider>
      </AuthStateProvider>
    </SessionProvider>
  );
}
