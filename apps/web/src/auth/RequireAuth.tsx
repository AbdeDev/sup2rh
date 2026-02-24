import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useSession } from "./useSession";
import { FeedbackButton } from "../components/FeedbackButton";

const REDIRECT_KEY = "redirectAfterLogin";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!session) {
    const from = location.pathname + location.search;
    if (from && from !== "/login") {
      sessionStorage.setItem(REDIRECT_KEY, from);
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <FeedbackButton />
    </>
  );
}
