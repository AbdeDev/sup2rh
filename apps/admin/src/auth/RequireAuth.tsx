import type { ReactNode } from "react";

// Auth temporairement désactivée pour les tests UI
export function RequireAuth({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
