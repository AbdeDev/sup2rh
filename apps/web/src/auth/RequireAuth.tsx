import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useSession } from "./useSession";
import { supabase } from "../lib/supabase";

let profileUpsertedFor: string | null = null;

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  if (loading) return <div className="p-6">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;

  const userId = session.user.id;
  if (profileUpsertedFor !== userId) {
    profileUpsertedFor = userId;
    supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });
  }

  return <>{children}</>;
}
