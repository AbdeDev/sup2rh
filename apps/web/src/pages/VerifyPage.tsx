import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";

import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

function useQueryParam(name: string) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name), [search, name]);
}

export function VerifyPage() {
  const email = useQueryParam("email") ?? "";
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const userId = data.session?.user.id;
    if (userId) {
      await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });
    }

    navigate("/quiz", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/25 mb-5 transition-transform duration-200 hover:scale-105">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">Vérification</h1>
          <p className="text-sm text-muted-foreground">
            Entre le code reçu par email{email ? ` à ${email}` : ""}
          </p>
        </div>

        <Card className="border border-border bg-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Code de vérification</p>
                <p className="text-[10px] text-muted-foreground">6 à 8 chiffres reçus par email</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={verifyOtp}>
              <div className="space-y-2">
                <Label htmlFor="token" className="text-xs font-medium text-muted-foreground">
                  Code
                </Label>
                <Input
                  id="token"
                  inputMode="numeric"
                  placeholder="••••••••"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 text-center text-2xl tracking-[0.3em] font-bold border-border bg-background rounded-xl"
                />
              </div>
              {error && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive animate-in fade-in duration-200">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.01] shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Vérification…
                  </>
                ) : (
                  "Valider et se connecter"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
