import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";

import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 mb-4 transition-transform duration-200 hover:scale-105">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-lg font-heading font-semibold text-foreground mb-2">Vérification</h1>
          <p className="text-xs text-muted-foreground">
            Code reçu par email{email ? ` (${email})` : ""}
          </p>
        </div>
        <Card className="border border-border bg-card transition-all duration-200 hover:border-primary/50">
          <CardContent className="p-5">
            <form className="space-y-4" onSubmit={verifyOtp}>
              <div className="space-y-2">
                <Label htmlFor="token" className="text-xs text-muted-foreground">
                  Code de vérification
                </Label>
                <Input
                  id="token"
                  inputMode="numeric"
                  placeholder="12345678"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 text-center text-xl tracking-[0.2em] font-medium border-border bg-background transition-all duration-200 focus:border-primary"
                />
              </div>
              {error && (
                <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-xs text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02]"
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
