"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { UserProfile } from "@/types";
import { MOCK_USER } from "@/services/mock-data";
import { STORAGE_KEYS, DEMO_CREDENTIALS } from "@/lib/constants";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 600));
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      setUser(MOCK_USER);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(MOCK_USER));
      return true;
    }
    if (email && password.length >= 6) {
      const demoUser = { ...MOCK_USER, email, id: `user-${Date.now()}` };
      setUser(demoUser);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(demoUser));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.user);
  }, []);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
