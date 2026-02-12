"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

interface AppSettingsContextValue {
  compactMode: boolean;
  setCompactMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [compactMode, setCompactMode] = useState(false);

  const value = useMemo(
    () => ({ compactMode, setCompactMode }),
    [compactMode]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }
  return context;
}
