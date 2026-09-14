import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import api, { formatApiError } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [client, setClient] = useState(undefined);

  /*
   * Verificare cont staff/admin
   */
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  /*
   * Verificare cont client
   */
  const refreshClient = useCallback(async () => {
    try {
      const { data } = await api.get("/client-auth/me");
      setClient(data);
      return data;
    } catch {
      setClient(null);
      return null;
    }
  }, []);

  /*
   * Refresh global.
   *
   * Cererile rulează în PARALEL,
   * nu una după alta.
   */
  const refresh = useCallback(async () => {
    await Promise.allSettled([
      refreshUser(),
      refreshClient(),
    ]);
  }, [refreshUser, refreshClient]);

  /*
   * La pornire verificăm doar tipul de autentificare
   * relevant pentru zona în care se află utilizatorul.
   */
  useEffect(() => {
    const path = window.location.pathname;

    const isClientArea =
      path === "/client" ||
      path.startsWith("/client/");

    const isStaffArea =
      path === "/admin" ||
      path.startsWith("/admin/") ||
      path === "/app" ||
      path.startsWith("/app/");

    /*
     * Admin / Employee
     *
     * Nu are sens să verificăm și sesiunea clientului.
     */
    if (isStaffArea) {
      setClient(null);
      refreshUser();
      return;
    }

    /*
     * Portal client
     *
     * Nu are sens să verificăm și sesiunea staff.
     */
    if (isClientArea) {
      setUser(null);
      refreshClient();
      return;
    }

    /*
     * Pentru "/" sau alte pagini publice verificăm
     * ambele sesiuni simultan.
     */
    refresh();
  }, [refresh, refreshUser, refreshClient]);

  /*
   * Login Admin / Employee
   */
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      setUser(data);

      return {
        ok: true,
        user: data,
      };
    } catch (e) {
      return {
        ok: false,
        error: formatApiError(
          e.response?.data?.detail
        ),
      };
    }
  }, []);

  /*
   * Logout Admin / Employee
   */
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout local chiar dacă serverul nu răspunde.
    }

    setUser(null);
  }, []);

  /*
   * Client - solicitare OTP
   */
  const clientRequestOtp = useCallback(async (phone) => {
    try {
      const { data } = await api.post(
        "/client-auth/request-otp",
        { phone }
      );

      return {
        ok: true,
        data,
      };
    } catch (e) {
      return {
        ok: false,
        error: formatApiError(
          e.response?.data?.detail
        ),
      };
    }
  }, []);

  /*
   * Client - verificare OTP
   */
  const clientVerifyOtp = useCallback(async (phone, code) => {
    try {
      const { data } = await api.post(
        "/client-auth/verify-otp",
        {
          phone,
          code,
        }
      );

      setClient(data.customer);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: formatApiError(
          e.response?.data?.detail
        ),
      };
    }
  }, []);

  /*
   * Client logout
   */
  const clientLogout = useCallback(async () => {
    try {
      await api.post("/client-auth/logout");
    } catch {
      // Logout local chiar dacă serverul nu răspunde.
    }

    setClient(null);
  }, []);

  /*
   * Evităm recrearea obiectului Context
   * la fiecare render.
   */
  const value = useMemo(
    () => ({
      user,
      client,

      refresh,
      refreshUser,
      refreshClient,

      login,
      logout,

      clientRequestOtp,
      clientVerifyOtp,
      clientLogout,
    }),
    [
      user,
      client,
      refresh,
      refreshUser,
      refreshClient,
      login,
      logout,
      clientRequestOtp,
      clientVerifyOtp,
      clientLogout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth trebuie folosit în interiorul AuthProvider"
    );
  }

  return context;
}
