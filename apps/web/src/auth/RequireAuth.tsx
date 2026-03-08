import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { supabase } from "../lib/supabase";
import { FeedbackButton } from "../components/FeedbackButton";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function RequireAuth({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const location = useLocation();

  useEffect(() => {
    // Vérifie la session en cours
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session ? "authenticated" : "unauthenticated");
    });

    // Écoute les changements d'état d'auth (logout, token refresh...)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authState === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    // Mémorise la page demandée pour rediriger après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      {children}
      <FeedbackButton />
    </>
  );
}
