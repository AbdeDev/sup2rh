import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { LoginForm } from "../components/login-form";

export function LoginPage() {
  const fromResult =
    typeof window !== "undefined" &&
    sessionStorage.getItem("redirectAfterLogin")?.startsWith("/result");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 mb-4 transition-transform duration-200 hover:scale-105">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-foreground mb-2">Sup2RH</h1>
          <p className="text-xs text-muted-foreground">Découvre ton métier RH idéal</p>
          {fromResult && (
            <p className="text-xs text-primary mt-2">
              Connecte-toi pour accéder à la page résultat.
            </p>
          )}
        </div>
        <LoginForm />
        <div className="mt-6 text-center">
          <Link
            to="/quiz"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Accéder au quiz
          </Link>
        </div>
      </div>
    </div>
  );
}
