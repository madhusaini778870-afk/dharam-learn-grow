import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getSessionServer,
  loginUserServer,
  registerUserServer,
  logoutServer,
  requestPasswordResetServer,
  resetPasswordServer,
  type SafeUser,
} from "@/services/authService";

export type AuthUser = SafeUser;

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthContextType = {
  session: AuthSession | null;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (
    email: string,
    pass: string,
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  signUp: (
    name: string,
    email: string,
    pass: string,
    confirmPass: string,
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (
    email: string,
  ) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (
    token: string,
    newPass: string,
    confirmPass: string,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  token: null,
  loading: true,
  isAdmin: false,
  login: async () => ({ success: false, error: "Not initialized" }),
  signUp: async () => ({ success: false, error: "Not initialized" }),
  signOut: async () => {},
  requestPasswordReset: async () => ({
    success: false,
    message: "Not initialized",
  }),
  resetPassword: async () => ({ success: false, error: "Not initialized" }),
  refreshSession: async () => {},
});

const COOKIE_NAME = "dhs_session_token";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // 1. Check document.cookie
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    if (match?.[2]) return decodeURIComponent(match[2]);

    // 2. Fallback token-only storage
    return sessionStorage.getItem(COOKIE_NAME);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      // 30 days cookie with Secure SameSite
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      sessionStorage.setItem(COOKIE_NAME, token);
    } else {
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
      sessionStorage.removeItem(COOKIE_NAME);
    }
  } catch {
    // ignore cookie errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useServerFn(getSessionServer);
  const callLogin = useServerFn(loginUserServer);
  const callRegister = useServerFn(registerUserServer);
  const callLogout = useServerFn(logoutServer);
  const callForgot = useServerFn(requestPasswordResetServer);
  const callReset = useServerFn(resetPasswordServer);

  const checkSession = useCallback(async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetchSession({ data: { token: existingToken } });
      if (res.authenticated && res.user) {
        setSession({ token: existingToken, user: res.user });
      } else {
        setStoredToken(null);
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [fetchSession]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(
    async (email: string, pass: string) => {
      try {
        const res = await callLogin({ data: { email, password: pass } });
        if (res.success && res.user && res.token) {
          setStoredToken(res.token);
          setSession({ token: res.token, user: res.user });
          return { success: true, user: res.user };
        }
        return { success: false, error: res.error ?? "Login failed." };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message || "An unexpected error occurred." };
      }
    },
    [callLogin],
  );

  const signUp = useCallback(
    async (name: string, email: string, pass: string, confirmPass: string) => {
      try {
        const res = await callRegister({
          data: { name, email, password: pass, confirmPassword: confirmPass },
        });
        if (res.success && res.user && res.token) {
          setStoredToken(res.token);
          setSession({ token: res.token, user: res.user });
          return { success: true, user: res.user };
        }
        return { success: false, error: res.error ?? "Registration failed." };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message || "An unexpected error occurred." };
      }
    },
    [callRegister],
  );

  const signOut = useCallback(async () => {
    const currentToken = session?.token || getStoredToken();
    if (currentToken) {
      try {
        await callLogout({ data: { token: currentToken } });
      } catch {
        // ignore logout errors
      }
    }
    setStoredToken(null);
    setSession(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dhs_auth_changed"));
    }
  }, [session, callLogout]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      try {
        const res = await callForgot({ data: { email } });
        return {
          success: res.success,
          message: res.message,
          resetToken: res.resetToken,
        };
      } catch (err: unknown) {
        return {
          success: false,
          message: (err as Error).message || "Failed to request password reset.",
        };
      }
    },
    [callForgot],
  );

  const resetPassword = useCallback(
    async (token: string, newPass: string, confirmPass: string) => {
      try {
        const res = await callReset({
          data: { token, newPassword: newPass, confirmPassword: confirmPass },
        });
        return res;
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message || "Failed to reset password." };
      }
    },
    [callReset],
  );

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    token: session?.token ?? null,
    loading,
    isAdmin: session?.user.role === "admin",
    login,
    signUp,
    signOut,
    requestPasswordReset,
    resetPassword,
    refreshSession: checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
