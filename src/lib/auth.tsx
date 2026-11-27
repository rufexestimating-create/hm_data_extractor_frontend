"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useRequireAuth() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session.loading && !session.user) router.replace("/login");
  }, [session.loading, session.user, router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...session, signOut };
}

export function useRedirectIfSignedIn() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (!session.loading && session.user) router.replace("/");
  }, [session.loading, session.user, router]);

  return session;
}

export function displayName(user: User): string {
  const name = user.user_metadata?.full_name;
  return typeof name === "string" && name ? name : (user.email?.split("@")[0] ?? "User");
}
