import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

import { supabase } from "../lib/supabase";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AppLogo } from "../components/AppLogo";

function useQueryParam(name: string) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name), [search, name]);
}

export function AuthConfirmPage() {
  const navigate = useNavigate();
  const tokenHash = useQueryParam("token_hash");
  const type = (useQueryParam("type") ?? "email") as "email";
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!tokenHash) {
      setError("Lien invalide: token manquant.");
      return;
    }

    setError(null);
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (verifyError) {
      setLoading(false);
      setError(verifyError.message || "Lien invalide ou expiré.");
      return;
    }

    const userId = data.session?.user.id;
    if (userId) {
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: userId, email: data.session?.user.email ?? undefined }, { onConflict: "id" });
      if (upsertError) {
        console.warn("[AuthConfirm] profiles upsert:", upsertError.message);
      }
    }

    setSuccess(true);
    setLoading(false);

    const redirect = sessionStorage.getItem("redirectAfterLogin");
    if (redirect) sessionStorage.removeItem("redirectAfterLogin");
    setTimeout(() => navigate(redirect || "/quiz", { replace: true }), 600);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 mb-5">
            <AppLogo className="h-10 w-10 object-contain" />
          </div>
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">
            Confirmer la connexion
          </h1>
          <p className="text-sm text-muted-foreground">
            Clique pour finaliser ta connexion de façon sécurisée.
          </p>
        </div>

        <Card className="border border-border bg-card rounded-2xl shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            {success && (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 border border-success/25">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            )}
            {error && (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 border border-destructive/25">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            )}
            {!success && !error && (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive text-left">
                {error}
              </div>
            )}

            {success ? (
              <p className="text-sm text-success">Connexion réussie, redirection en cours…</p>
            ) : (
              <Button
                type="button"
                className="w-full h-11 text-sm rounded-xl"
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validation…
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            )}

            {!success && (
              <Button
                variant="outline"
                className="w-full h-10 text-sm rounded-xl"
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
