import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Mail, Shield, Calendar, ArrowLeft } from "lucide-react";

import { supabase } from "../lib/supabase";
import { getMe } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

export function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1.5 h-8 w-8 transition-all duration-200 hover:bg-accent"
            onClick={() => navigate("/quiz")}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-200" />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <span className="text-xs text-muted-foreground">Profil</span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 animate-in fade-in duration-500">
        <div className="max-w-xl mx-auto">
          {error && (
            <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center animate-in fade-in duration-300">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-4">
                <User className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">Chargement…</p>
            </div>
          ) : user ? (
            <Card className="border border-border bg-card transition-all duration-200 hover:border-primary/50 animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 mx-auto mb-3 transition-transform duration-200 hover:scale-105">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Mon compte</p>
                <p className="text-xs text-muted-foreground mt-1">Sup2RH</p>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="rounded-lg border border-border bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50 hover:border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 transition-transform duration-200 hover:scale-105">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Email
                      </p>
                      <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50 hover:border-success/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20 border border-success/30 transition-transform duration-200 hover:scale-105">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Rôle
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        ID utilisateur
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground break-all">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border my-4" />

                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full h-10 text-sm border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}
