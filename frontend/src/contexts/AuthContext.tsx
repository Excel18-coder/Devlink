import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: "developer" | "employer" | "admin";
  fullName: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_CACHE_KEY = "devlink_user";

function readCachedUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null) {
  if (user) {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_CACHE_KEY);
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialise from sessionStorage so the app can render instantly on refresh
  const [user, setUser] = useState<User | null>(readCachedUser);
  const [loading, setLoading] = useState(() => {
    // If we have a cached user we can skip the loading spinner
    return !readCachedUser() && !!localStorage.getItem("accessToken");
  });

  const setAndCache = (u: User | null) => {
    setUser(u);
    writeCachedUser(u);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    // If we already have a cached user, re-validate in the background (no
    // spinner — user sees content immediately)
    const cached = readCachedUser();
    if (cached) {
      // Silently refresh in the background
      api<User>("/auth/me")
        .then(setAndCache)
        .catch(() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setAndCache(null);
        });
      return; // loading was already false
    }
    // No cache — must wait for /auth/me before rendering protected routes
    api<User>("/auth/me")
      .then(setAndCache)
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      role: "developer" | "employer" | "admin";
      email: string;
      fullName: string;
      status: string;
    }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    // Build the user object directly — no second /auth/me round-trip
    setAndCache({
      id: data.userId,
      email: data.email,
      role: data.role,
      fullName: data.fullName,
      status: data.status,
    });
  };

  const register = async (email: string, password: string, role: string, fullName?: string) => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      role: "developer" | "employer" | "admin";
      email: string;
      fullName: string;
      status: string;
    }>("/auth/register", {
      method: "POST",
      body: { email, password, role, fullName },
    });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    // Build the user object directly — no second /auth/me round-trip
    setAndCache({
      id: data.userId,
      email: data.email,
      role: data.role,
      fullName: data.fullName,
      status: data.status,
    });
  };

  const logout = () => {
    const refreshToken = localStorage.getItem("refreshToken");
    api("/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAndCache(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

