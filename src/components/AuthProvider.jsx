import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "@hooks/useAuth";
import * as authService from "@services/authService";
import { endSession, setAccessToken, subscribeToSessionEnd } from "@services/session";

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    authService
      .restoreSession()
      .then((user) => {
        if (!cancelled) {
          setState({ status: "authenticated", user });
          setNotice("");
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setState({ status: "anonymous", user: null });
          if (cause.status !== 401) {
            setNotice(cause.message || "Could not verify the current session.");
          }
        }
      });

    const unsubscribe = subscribeToSessionEnd((reason) => {
      setState({ status: "anonymous", user: null });
      if (reason === "logout") {
        setNotice("");
      } else {
        setNotice(
          reason === "revoked"
            ? "Your session ended because your account signed in elsewhere."
            : "Your session expired. Please sign in again.",
        );
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const user = await authService.login(credentials);
    if (user.role !== "admin") {
      try {
        await authService.logout();
      } finally {
        setAccessToken(null);
      }
      throw new Error("This account does not have administrator access.");
    }
    setNotice("");
    setState({ status: "authenticated", user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      endSession("logout");
      setState({ status: "anonymous", user: null });
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, notice, clearNotice: () => setNotice(""), login, logout }),
    [state, notice, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
