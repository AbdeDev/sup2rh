import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useSession } from "./useSession";
import { getMe } from "../lib/api";
import { useEffect, useRef, useState } from "react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading, hasAdminToken } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (checkedRef.current) return;

    if (session || hasAdminToken) {
      checkedRef.current = true;
      getMe()
        .then((user) => setIsAdmin(user.role === "ADMIN"))
        .catch(() => setIsAdmin(false))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionLoading, session, hasAdminToken]);

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!session && !hasAdminToken) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-sm text-destructive">Accès refusé</p>
          <p className="text-xs text-muted-foreground">
            Tu n&apos;as pas les permissions nécessaires, ou l&apos;API ne répond pas. Vérifie que{" "}
            <code className="bg-muted px-1 rounded">bun run dev:api</code> tourne et que ton profil
            a le rôle ADMIN.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
