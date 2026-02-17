import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      navigate(`/check-email?email=${encodeURIComponent(email)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 mb-4 transition-transform duration-200 hover:scale-105">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-foreground mb-2">Admin Sup2RH</h1>
          <p className="text-xs text-muted-foreground">Connexion administrateur</p>
        </div>
        <Card className="border border-border bg-card">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10 text-sm border-border bg-background"
                />
              </div>
              {error && (
                <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-xs text-destructive">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Envoi…" : "Envoyer le lien magique"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
