import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";
import { Button } from "../../../web/src/components/ui/button";
import { Input } from "../../../web/src/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../web/src/components/ui/card";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "http://localhost:5173/auth/callback",
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
    navigate(`/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Entre ton email, on t’envoie un lien magique.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={sendMagicLink}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            {sent && !error && (
              <div className="text-sm text-muted-foreground">
                Lien envoyé. Vérifie ta boîte mail (et tes spams).
              </div>
            )}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer le lien"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
