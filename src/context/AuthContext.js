import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [banMessage, setBanMessage] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return;

    // Banned accounts are blocked at the app level: we sign them straight
    // back out the moment we see the flag, whether that's right after
    // login or on a later app open with an existing session.
    if (data?.banned) {
      await supabase.auth.signOut();
      setProfile(null);
      setBanMessage("Your account has been suspended. Contact support if you think this is a mistake.");
      return;
    }

    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfile(session?.user?.id).finally(() => setInitializing(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchProfile(session?.user?.id);
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  // IMPORTANT: per the product spec, a new account never logs the person in
  // automatically. We sign the user back out right after registration so
  // they land on the Login screen and sign in themselves.
  // The matching `profiles` row is created automatically by a database
  // trigger (see supabase/schema.sql) the instant the auth account exists —
  // this is more reliable than inserting it from the client, since it
  // doesn't depend on the client having an active session yet.
  const signUp = async ({ fullName, email, password }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error };

    await supabase.auth.signOut();
    return { error: null };
  };

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isPremium = profile?.plan === "premium" &&
    (!profile?.plan_expires_at || new Date(profile.plan_expires_at) > new Date());

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    isAdmin: profile?.role === "admin",
    isPremium,
    initializing,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => fetchProfile(session?.user?.id),
    banMessage,
    clearBanMessage: () => setBanMessage(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
