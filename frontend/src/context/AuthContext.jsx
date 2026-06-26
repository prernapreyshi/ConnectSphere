import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, logoutUser } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, try to restore session from stored access token
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }

    getMe()
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("accessToken"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((accessToken, userData) => {
    localStorage.setItem("accessToken", accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await logoutUser(); } catch (_) {}
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
