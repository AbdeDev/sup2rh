import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { supabase } from "../lib/supabase";
import { getAdminToken } from "../lib/api";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function RequireAuth({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() =>
    getAdminToken() ? "authenticated" : "loading",
  );
  const location = useLocation();

  useEffect(() => {
    // Si un token admin manuel est présent, on considère l'auth comme valide
    if (getAdminToken()) {
      setAuthState("authenticated");
      return;
    }

    // Sinon on vérifie la session Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!getAdminToken()) {
        setAuthState(session ? "authenticated" : "unauthenticated");
      }
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
