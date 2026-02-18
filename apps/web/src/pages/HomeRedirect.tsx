import { Navigate } from "react-router-dom";
import { useSession } from "../auth/useSession";

/** Redirige / vers /quiz si connecté, sinon /login. */
export function HomeRedirect() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return <Navigate to={session ? "/quiz" : "/login"} replace />;
}
