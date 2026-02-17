import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useSession } from "./useSession";
import { getMe } from "../lib/api";
import { useEffect, useState } from "react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && !sessionLoading) {
      getMe()
        .then((user) => {
          setIsAdmin(user.role === "ADMIN");
        })
        .catch(() => setIsAdmin(false))
        .finally(() => setLoading(false));
    } else if (!session && !sessionLoading) {
      setLoading(false);
    }
  }, [session, sessionLoading]);

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-sm text-destructive">Accès refusé</p>
          <p className="text-xs text-muted-foreground">
            Tu n&apos;as pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
