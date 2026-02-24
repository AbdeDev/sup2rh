import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import { supabase } from "../lib/supabase";
import { Card, CardContent } from "../components/ui/card";
import { AppLogo } from "../components/AppLogo";
import { Button } from "../components/ui/button";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connexion en cours…");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          setError(
            "Session introuvable. Assure-toi que le lien s'ouvre dans le même navigateur et que les URLs de redirection Supabase sont configurées.",
          );
          return;
        }

        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            { id: data.session.user.id, email: data.session.user.email ?? undefined },
            { onConflict: "id" },
          );
        if (upsertError) {
          console.warn("[Auth] profiles upsert:", upsertError.message);
        }

        setStatus("Connexion réussie !");
        setSuccess(true);

        const redirect = sessionStorage.getItem("redirectAfterLogin");
        if (redirect) sessionStorage.removeItem("redirectAfterLogin");
        setTimeout(() => {
          navigate(redirect || "/quiz", { replace: true });
        }, 1200);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erreur d'authentification.";
        setError(message);
        setStatus("Erreur");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          {success ? (
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 border border-success/25 mb-5 animate-in scale-in duration-300">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          ) : error ? (
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 border border-destructive/25 mb-5 animate-in scale-in duration-300">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          ) : (
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 mb-5">
              <AppLogo className="h-10 w-10 object-contain" />
            </div>
          )}
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">
            {success ? "Bienvenue !" : error ? "Erreur" : "Connexion en cours"}
          </h1>
        </div>

        <Card className="border border-border bg-card rounded-2xl shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            {!success && !error && (
              <Loader2 className="h-7 w-7 animate-spin text-primary mx-auto" />
            )}
            <p
              className={`text-sm font-medium ${
                error ? "text-destructive" : success ? "text-success" : "text-muted-foreground"
              }`}
            >
              {status}
            </p>
            {error && (
              <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive text-left">
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
                <p className="text-xs text-muted-foreground">Redirection en cours…</p>
              </div>
            )}
            {error && (
              <Button
                variant="outline"
                className="h-10 text-sm rounded-xl"
                onClick={() => navigate("/login")}
              >
                Retour à la connexion
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
