"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { UserProfile } from "@/types";
import { MOCK_USER } from "@/services/mock-data";
import { STORAGE_KEYS, DEMO_CREDENTIALS } from "@/lib/constants";
import { getSupabaseClient } from "@/lib/supabase";

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
    const supabase = getSupabaseClient();
  
    if (!supabase) {
      console.error("Supabase no configurado");
      return false;
    }
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error || !data.user) {
      return false;
    }
  
    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName:
        data.user.user_metadata?.fullName ??
        data.user.user_metadata?.name ??
        "Usuario Fiscal Copilot",
      role: "contador",
      createdAt: data.user.created_at,
    };
  
    setUser(userProfile);
  
    localStorage.setItem(
      STORAGE_KEYS.user,
      JSON.stringify(userProfile)
    );
  
    return true;
  }, []);

  const logout = useCallback(async () => {
    const supabase = getSupabaseClient();
  
    if (supabase) {
      await supabase.auth.signOut();
    }
  
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
