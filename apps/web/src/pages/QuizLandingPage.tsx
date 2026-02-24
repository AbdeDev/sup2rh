import { useNavigate } from "react-router-dom";
import { CheckCircle2, Play, ArrowRight, User, LogOut, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { AppLogo } from "../components/AppLogo";

export function QuizLandingPage() {
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userMenuOpen]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-11 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-3 md:px-5">
          <button
            type="button"
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity -ml-0.5"
            aria-label="Accueil"
          >
            <AppLogo className="h-10 w-10 shrink-0 object-contain transition-transform duration-200 hover:scale-110" />
            <span className="text-xs font-medium text-foreground truncate">Quizz SupDesRh</span>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <User className="h-4 w-4" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-border bg-card py-1 shadow-lg z-50">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <User className="h-3.5 w-3.5" />
                    Profil
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* Hero */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex h-24 w-24 items-center justify-center mb-5 transition-transform duration-300 hover:scale-110">
              <AppLogo className="h-20 w-20 object-contain" />
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-semibold text-foreground mb-3">
              Quel métier RH est fait pour toi ?
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Réponds à quelques questions et découvre ton profil parmi : Recrutement, Paie, QVCT,
              Assistant RH ou Formation.
            </p>
            <Button
              onClick={() => navigate("/quiz/start")}
              className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Commencer le quiz
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Gratuit · Sans inscription · Résultat immédiat
            </p>
            <div className="mt-4 flex items-center justify-center">
              <button
                onClick={() => navigate("/sessions")}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors duration-200"
              >
                <Clock className="h-3 w-3" />
                Mes sessions
              </button>
            </div>
          </div>

          {/* Étapes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            <Card className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 ease-out">
              <CardContent className="p-5 text-center space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-primary font-semibold text-sm">
                  1
                </div>
                <p className="text-sm text-foreground font-medium">Tu fais le quiz</p>
                <p className="text-xs text-muted-foreground">Questions rapides</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-success/40 hover:-translate-y-0.5 transition-all duration-300 ease-out">
              <CardContent className="p-5 text-center space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-success/20 border border-success/30 text-success font-semibold text-sm">
                  2
                </div>
                <p className="text-sm text-foreground font-medium">Tu découvres ton profil</p>
                <p className="text-xs text-muted-foreground">Résultat personnalisé</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-orange/40 hover:-translate-y-0.5 transition-all duration-300 ease-out">
              <CardContent className="p-5 text-center space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange/20 border border-orange/30 text-orange font-semibold text-sm">
                  3
                </div>
                <p className="text-sm text-foreground font-medium">Tu prends contact</p>
                <p className="text-xs text-muted-foreground">Pour avancer avec Sup des RH</p>
              </CardContent>
            </Card>
          </div>

          {/* Sections info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 ease-out">
              <CardContent className="p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Pourquoi ce quiz ?
                </h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      Tu t&apos;intéresses aux{" "}
                      <span className="text-foreground font-medium">Ressources Humaines</span> et tu
                      hésites sur ton orientation ?
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      Ce quiz t&apos;aide à{" "}
                      <span className="text-foreground font-medium">identifier</span> le domaine RH
                      qui te correspond le mieux, en 2 minutes.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-success/30 transition-all duration-300 ease-out">
              <CardContent className="p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Play className="h-4 w-4 text-success" />
                  Ce que tu obtiens
                </h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span>
                      Un <span className="text-foreground font-medium">profil RH</span> parmi :
                      Recrutement, Paie, QVCT, Assistant RH, Formation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span>
                      Les <span className="text-foreground font-medium">vidéos témoignage</span>{" "}
                      d&apos;alternants qui exercent ce métier
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success mt-0.5">•</span>
                    <span>
                      Les <span className="text-foreground font-medium">contacts utiles</span> et la
                      prochaine date de{" "}
                      <span className="text-foreground font-medium">Portes Ouvertes</span>
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
