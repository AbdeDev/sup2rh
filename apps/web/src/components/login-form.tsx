import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

import { supabase } from "../lib/supabase";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate(`/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
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
                placeholder="m@example.com"
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
      <p className="text-center text-[11px] text-muted-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground transition-colors">
        En continuant, tu acceptes nos{" "}
        <a href="#" className="hover:text-primary">
          Conditions d&apos;utilisation
        </a>{" "}
        et notre{" "}
        <a href="#" className="hover:text-primary">
          Politique de confidentialité
        </a>
        .
      </p>
    </div>
  );
}
