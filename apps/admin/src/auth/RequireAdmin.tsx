import { type ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";

import { getMe } from "../lib/api";

type AdminState = "loading" | "admin" | "forbidden";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>("loading");

  useEffect(() => {
    getMe()
      .then((user) => setState(user.role === "ADMIN" ? "admin" : "forbidden"))
      .catch(() => setState("forbidden"));
  }, []);

  if (state === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4 text-center p-6">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-lg font-heading font-bold text-foreground">Accès refusé</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Ton compte n'a pas les droits administrateur. Contacte un admin pour obtenir l'accès.
        </p>
        <Navigate to="/login" replace />
      </div>
    );
  }

  return <>{children}</>;
}
