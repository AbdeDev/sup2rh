import type { ReactNode } from "react";

import { FeedbackButton } from "../components/FeedbackButton";

// Auth temporairement désactivée pour les tests UI
export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <FeedbackButton />
    </>
  );
}
