import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, Loader2, Inbox } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { supabase } from "../lib/supabase";

export function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  async function handleResend() {
    if (!email.trim()) return;
    setResendError(null);
    setResendLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setResendLoading(false);
    if (error) {
      const msg =
        (error as { message?: string; error_description?: string }).message ||
        (error as { error_description?: string }).error_description ||
        "Impossible d'envoyer le lien. Réessaie plus tard.";
      setResendError(msg);
    } else {
      setResendDone(true);
      setTimeout(() => setResendDone(false), 4000);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 border border-success/25 mb-5 transition-transform duration-200 hover:scale-105">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">
            Vérifie ta boîte mail
          </h1>
          <p className="text-sm text-muted-foreground">
            On t&apos;a envoyé un lien de connexion magique
          </p>
        </div>

        <Card className="border border-border bg-card rounded-2xl shadow-lg">
          <CardContent className="p-6 space-y-4">
            {email && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground truncate">{email}</span>
              </div>
            )}

            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                  1
                </div>
                <p className="text-sm text-muted-foreground pt-0.5">Ouvre ta boîte mail</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                  2
                </div>
                <p className="text-sm text-muted-foreground pt-0.5">Clique sur le lien reçu</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-success/10 border border-success/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-success">
                  3
                </div>
                <p className="text-sm text-muted-foreground pt-0.5">
                  Tu seras connecté automatiquement
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
              <Inbox className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Pense à vérifier tes spams si tu ne vois pas le mail dans les prochaines minutes.
              </p>
            </div>

            {email && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 text-sm border-border rounded-xl transition-all duration-200"
                disabled={resendLoading || resendDone}
                onClick={handleResend}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi…
                  </>
                ) : resendDone ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                    Lien renvoyé !
                  </>
                ) : (
                  "Renvoyer le lien"
                )}
              </Button>
            )}

            {resendError && (
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                {resendError}
              </div>
            )}

            <Button
              asChild
              variant="outline"
              className="w-full h-10 text-sm border-border rounded-xl transition-all duration-200"
            >
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
