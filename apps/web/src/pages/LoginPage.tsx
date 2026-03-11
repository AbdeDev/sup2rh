import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LoginForm } from "../components/login-form";
import { AppLogo } from "../components/AppLogo";
import { ThemeToggle } from "../components/ThemeToggle";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mémorise la destination originale pour rediriger après connexion
  const fromPath = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  if (fromPath && fromPath !== "/login") {
    sessionStorage.setItem("redirectAfterLogin", fromPath);
  }

  const fromResult =
    typeof window !== "undefined" &&
    sessionStorage.getItem("redirectAfterLogin")?.startsWith("/result");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center mb-5 transition-transform duration-300 hover:scale-110">
            <AppLogo className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
            Rh et moi by SUP des RH
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Découvre ton métier RH idéal grâce à notre quiz personnalisé
          </p>
          {fromResult && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary">
              Connecte-toi pour voir ton résultat
            </div>
          )}
        </div>

        <LoginForm />

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Pas besoin de mot de passe, juste ton email.
          </p>
          <button
            type="button"
            onClick={() => navigate("/fiches")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
          >
            Voir les fiches métiers sans connexion
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
