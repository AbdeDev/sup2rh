import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { adminLogin, setAdminToken } from "../lib/api";
import { AppLogo } from "../components/AppLogo";
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
      const res = await adminLogin(email);
      setAdminToken(res.token);
      navigate("/admin", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      if (msg === "Failed to fetch" || msg.includes("fetch")) {
        setError("L'API ne répond pas. Lance d'abord : bun run dev:api");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#008c54]/[0.05] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#f37021]/[0.03] blur-[80px]" />
      </div>
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center mb-5 transition-transform duration-300 hover:scale-110">
            <AppLogo className="h-20 w-20 object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Admin SUP des RH</h1>
          <p className="text-sm text-muted-foreground">Panneau d'administration sécurisé</p>
        </div>

        <Card className="border border-border bg-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Connexion sécurisée</p>
                <p className="text-[10px] text-muted-foreground">Email administrateur uniquement</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@supdesrh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 text-sm border-border bg-background rounded-xl focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive space-y-2">
                  <p className="font-medium">{error}</p>
                  {!error.includes("L'API ne répond pas") && (
                    <p className="text-muted-foreground">
                      <a
                        href={`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/debug/profiles`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary hover:text-primary/80"
                      >
                        Voir les profils
                      </a>{" "}
                      (en dev)
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all duration-200 hover:scale-[1.01] shadow-sm font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  "Accéder au dashboard"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          SUP des RH · Administration sécurisée
        </p>
      </div>
    </div>
  );
}
