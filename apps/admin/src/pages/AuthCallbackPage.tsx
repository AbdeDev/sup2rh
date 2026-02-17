import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import { supabase } from "../lib/supabase";
import { Card, CardContent } from "../components/ui/card";

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
            "Session introuvable. Assure-toi que le lien s&apos;ouvre dans le même navigateur et que les URLs de redirection Supabase sont configurées.",
          );
          return;
        }

        await supabase.from("profiles").upsert({ id: data.session.user.id }, { onConflict: "id" });

        setStatus("Connexion réussie !");
        setSuccess(true);

        const redirect = sessionStorage.getItem("redirectAfterLogin");
        if (redirect) sessionStorage.removeItem("redirectAfterLogin");
        setTimeout(() => {
          navigate(redirect || "/admin", { replace: true });
        }, 1500);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erreur d&apos;authentification.";
        setError(message);
        setStatus("Erreur");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          {success ? (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-success/20 border border-success/30 mb-4 transition-transform duration-200 hover:scale-105 animate-in scale-in duration-300">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
          ) : error ? (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/20 border border-destructive/30 mb-4 transition-transform duration-200 animate-in scale-in duration-300">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
          ) : (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 mb-4 transition-transform duration-200">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
          )}
          <h1 className="text-lg font-heading font-semibold text-foreground mb-2">
            {success ? "Connecté !" : error ? "Erreur" : "Connexion"}
          </h1>
        </div>
        <Card className="border border-border bg-card transition-all duration-200 hover:border-primary/50">
          <CardContent className="p-6 text-center space-y-3">
            <p
              className={`text-sm transition-colors duration-200 ${
                error ? "text-destructive" : success ? "text-success" : "text-muted-foreground"
              }`}
            >
              {status}
            </p>
            {error && (
              <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-xs text-destructive text-left animate-in fade-in slide-in-from-top-2 duration-200">
                {error}
              </div>
            )}
            {success && (
              <p className="text-xs text-muted-foreground animate-in fade-in duration-300">
                Redirection en cours…
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
