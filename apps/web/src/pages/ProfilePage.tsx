import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  User,
  Mail,
  Shield,
  Trophy,
  Clock,
  ArrowRight,
  Briefcase,
  Settings,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { getMe, getQuizSessions, type QuizSession } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { AppLogo } from "../components/AppLogo";

export function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [location.pathname]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const [userData, sessionsRes] = await Promise.all([
        getMe(),
        getQuizSessions().catch(() => ({ items: [] as QuizSession[] })),
      ]);
      setUser(userData);
      setSessions(sessionsRes.items);
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

  const completedCount = sessions.filter((s) => s.finalJobId).length;
  const inProgressCount = sessions.filter((s) => !s.finalJobId).length;
  const lastCompleted = sessions.find((s) => s.finalJobId);

  const jobLabel = (id: string | null) => {
    if (!id) return "—";
    return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="Accueil"
          >
            <AppLogo className="h-9 w-9 object-contain" />
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                RH&MOI <span className="font-normal text-muted-foreground">by</span> SUP des RH
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                Profil
              </span>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border rounded-xl"
              onClick={() => navigate("/sessions")}
            >
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Mes sessions
            </Button>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center animate-in fade-in duration-300">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
                <User className="h-8 w-8 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">Chargement…</p>
            </div>
          ) : user ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Avatar & info */}
              <div className="text-center">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 mb-4 transition-transform duration-200 hover:scale-105">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-2xl font-heading font-bold text-foreground mb-1">
                  {user.email.split("@")[0]}
                </h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border"
                  style={{
                    background:
                      user.role === "ADMIN" ? "rgba(243,112,33,0.08)" : "rgba(0,140,84,0.08)",
                    borderColor:
                      user.role === "ADMIN" ? "rgba(243,112,33,0.2)" : "rgba(0,140,84,0.2)",
                    color: user.role === "ADMIN" ? "#f37021" : "#008c54",
                  }}
                >
                  <Shield className="h-3 w-3" />
                  {user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: completedCount,
                    label: `Complété${completedCount > 1 ? "s" : ""}`,
                    icon: Trophy,
                    color: "#004080",
                  },
                  { value: inProgressCount, label: "En cours", icon: Clock, color: "#f37021" },
                  { value: sessions.length, label: "Total", icon: Briefcase, color: "#008c54" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="border border-border bg-card text-center rounded-2xl"
                    >
                      <CardContent className="p-4">
                        <div
                          className="h-10 w-10 mx-auto rounded-xl flex items-center justify-center mb-2"
                          style={{
                            background: `${stat.color}12`,
                            border: `1px solid ${stat.color}30`,
                          }}
                        >
                          <Icon className="h-4 w-4" style={{ color: stat.color }} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {stat.label}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Last result */}
              {lastCompleted && (
                <Card
                  className="border border-border bg-card cursor-pointer group rounded-2xl transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                  onClick={() =>
                    navigate(`/result/${lastCompleted.id}`, {
                      state: { sessionSummary: lastCompleted },
                    })
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: "rgba(0,140,84,0.1)",
                            border: "1px solid rgba(0,140,84,0.2)",
                          }}
                        >
                          <Trophy className="h-5 w-5" style={{ color: "#008c54" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                            Dernier résultat
                          </p>
                          <p className="text-sm font-heading font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {jobLabel(lastCompleted.finalJobId)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Account info */}
              <Card className="border border-border bg-card rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-heading font-bold text-foreground uppercase tracking-wider">
                      Informations du compte
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Email
                        </p>
                        <p className="text-sm text-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Identifiant
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground break-all">
                          {user.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => navigate("/quiz/start")}
                  className="flex-1 h-11 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200"
                >
                  Nouveau quiz
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex-1 h-11 text-sm border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
