"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthState = { status: "loading" } | { status: "out" } | { status: "in"; name: string; role: UserRole };

const AuthContext = createContext<AuthState>({ status: "loading" });

/** Shares "who is signed in" with the header and the status bar, so each page asks the browser only once. */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Nothing to look up; resolve on the next tick so this stays an async update.
      const t = setTimeout(() => setState({ status: "out" }), 0);
      return () => clearTimeout(t);
    }
    const supabase = createClient();
    let alive = true;

    async function load(userId: string) {
      const { data } = await supabase.from("profiles").select("full_name, role").eq("id", userId).maybeSingle();
      if (!alive) return;
      if (data && isUserRole(data.role)) setState({ status: "in", name: data.full_name, role: data.role });
      else setState({ status: "out" });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session?.user) void load(data.session.user.id);
      else setState({ status: "out" });
    });

    // Fires on sign-in, sign-out and silent token refresh (in any tab). Do the lookup outside the callback.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setState({ status: "out" });
        return;
      }
      const id = session.user.id;
      setTimeout(() => void load(id), 0);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
