import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined=loading, null=guest
  const [client, setClient] = useState(undefined);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
    try {
      const { data } = await api.get("/client-auth/me");
      setClient(data);
    } catch {
      setClient(null);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return { ok: true, user: data };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) };
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    setUser(null);
  };

  const clientRequestOtp = async (phone) => {
    try {
      const { data } = await api.post("/client-auth/request-otp", { phone });
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) };
    }
  };

  const clientVerifyOtp = async (phone, code) => {
    try {
      const { data } = await api.post("/client-auth/verify-otp", { phone, code });
      setClient(data.customer);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) };
    }
  };

  const clientLogout = async () => {
    try { await api.post("/client-auth/logout"); } catch { /* ignore */ }
    setClient(null);
  };

  return (
    <AuthContext.Provider value={{
      user, client, refresh, login, logout,
      clientRequestOtp, clientVerifyOtp, clientLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
