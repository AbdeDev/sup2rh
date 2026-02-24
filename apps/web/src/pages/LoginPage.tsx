import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { LoginForm } from "../components/login-form";
import { ThemeToggle } from "../components/ThemeToggle";

export function LoginPage() {
  const navigate = useNavigate();
  const fromResult =
    typeof window !== "undefined" &&
    sessionStorage.getItem("redirectAfterLogin")?.startsWith("/result");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-500 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 mb-4 transition-transform duration-200 hover:scale-105">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-foreground mb-2">SupdesRH</h1>
          <p className="text-xs text-muted-foreground">Découvre ton métier RH idéal</p>
          {fromResult && (
            <p className="text-xs text-primary mt-2">
              Connecte-toi pour accéder à la page résultat.
            </p>
          )}
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Connecte-toi pour accéder au quiz et découvrir ton métier RH.
        </p>
        <p className="mt-2 text-center">
          <button
            type="button"
            onClick={() => navigate("/fiches")}
            className="text-xs text-primary hover:underline"
          >
            Voir les fiches métiers sans connexion →
          </button>
        </p>
      </div>
    </div>
  );
}
