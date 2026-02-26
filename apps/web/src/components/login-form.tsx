import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../lib/supabase";

const OTP_COOLDOWN_MS = 60_000;
const OTP_LAST_SENT_KEY = "supdesrh_otp_last_sent_at";

function isRateLimitError(error: { message?: string; status?: number }): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  return (
    error?.status === 429 ||
    msg.includes("rate limit") ||
    msg.includes("too many") ||
    msg.includes("trop de requêtes")
  );
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const now = Date.now();
  const lastSentAt = Number(localStorage.getItem(OTP_LAST_SENT_KEY) || "0");
  const remainingMs = Math.max(0, OTP_COOLDOWN_MS - (now - lastSentAt));
  const isCooldownActive = remainingMs > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (isCooldownActive) {
      const remainingSec = Math.ceil(remainingMs / 1000);
      setError(`Patiente ${remainingSec}s avant de redemander un lien.`);
      return;
    }

    const trimmed = email.trim();
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (err) {
      if (isRateLimitError(err)) {
        setError(
          "Trop de demandes. Vérifie ta boîte mail (et les spams), puis réessaie dans un moment.",
        );
      } else {
        const msg =
          (err as { message?: string; error_description?: string }).message ||
          (err as { error_description?: string }).error_description ||
          "Impossible d'envoyer le lien. Vérifie ta config SMTP dans Supabase ou réessaie plus tard.";
        setError(msg);
      }
      return;
    }

    localStorage.setItem(OTP_LAST_SENT_KEY, String(Date.now()));
    navigate(`/check-email?email=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <Card className="border border-border bg-card rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Connexion rapide</p>
              <p className="text-[10px] text-muted-foreground">Un lien magique envoyé par email</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Adresse email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ton.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 text-sm pl-10 border-border bg-background rounded-xl"
                />
              </div>
            </div>
            {error && (
              <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.01] shadow-sm"
              disabled={loading || isCooldownActive}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours…
                </>
              ) : isCooldownActive ? (
                `Réessaie dans ${Math.ceil(remainingMs / 1000)}s`
              ) : (
                "Recevoir le lien magique"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
        En continuant, tu acceptes nos{" "}
        <a
          href="/legal/conditions"
          className="underline underline-offset-2 hover:text-primary transition-colors"
        >
          Conditions d&apos;utilisation
        </a>{" "}
        et notre{" "}
        <a
          href="/legal/confidentialite"
          className="underline underline-offset-2 hover:text-primary transition-colors"
        >
          Politique de confidentialité
        </a>
        .
      </p>
    </div>
  );
}
