"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useSession } from "next-auth/react";

interface AuthStateContextValue {
  isAuthenticated: boolean;
  accessToken?: string;
  userId?: string;
  role?: "admin" | "user";
  status: "loading" | "authenticated" | "unauthenticated";
}

const AuthStateContext = createContext<AuthStateContextValue | undefined>(undefined);

export function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const value = useMemo<AuthStateContextValue>(
    () => ({
      isAuthenticated: Boolean(session?.user),
      accessToken: session?.user?.accessToken,
      userId: session?.user?.id,
      role: session?.user?.role,
      status,
    }),
    [session, status]
  );

  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error("useAuthState must be used inside AuthStateProvider");
  }

  return context;
}
