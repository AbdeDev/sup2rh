import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSession } from "../auth/useSession";

export function HomeRedirect() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return <Navigate to={session ? "/quiz" : "/login"} replace />;
}
