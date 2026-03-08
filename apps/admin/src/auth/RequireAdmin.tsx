import type { ReactNode } from "react";

// Auth admin temporairement désactivée pour les tests UI
export function RequireAdmin({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
