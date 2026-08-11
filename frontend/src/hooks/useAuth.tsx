"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "@/types";
import { apiService } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("ridesync_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = await apiService.getMe();
      setUser(profile);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      localStorage.removeItem("ridesync_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiService.login({ email, password });
    localStorage.setItem("ridesync_token", res.access_token);
    await refreshUser();
  };

  const register = async (data: any) => {
    await apiService.register(data);
    // Auto login after registration
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem("ridesync_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
