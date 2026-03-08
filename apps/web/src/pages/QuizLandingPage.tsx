import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Play,
  ArrowRight,
  User,
  LogOut,
  Clock,
  Sparkles,
  Target,
  MessageSquare,
} from "lucide-react";
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
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="Accueil"
          >
            <AppLogo className="h-9 w-9 shrink-0 object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                Quiz SUP des RH
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Quiz d'orientation</p>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
              onClick={() => navigate("/sessions")}
            >
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Mes sessions
            </Button>
            <ThemeToggle />
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <User className="h-4 w-4" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-card py-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors rounded-lg mx-0.5"
                    style={{ width: "calc(100% - 4px)" }}
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Mon profil
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors rounded-lg mx-0.5 sm:hidden"
                    style={{ width: "calc(100% - 4px)" }}
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/sessions");
                    }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Mes sessions
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors rounded-lg mx-0.5"
                    style={{ width: "calc(100% - 4px)" }}
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
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-14">
          {/* Hero */}
          <div className="text-center mb-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex h-24 w-24 items-center justify-center mb-6 transition-transform duration-300 hover:scale-110">
              <AppLogo className="h-24 w-24 object-contain" />
            </div>
            <br />
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-medium text-primary mb-4">
              <Sparkles className="h-3 w-3" />
              Quiz gratuit · Résultat immédiat
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Quel métier RH est{" "}
              <span className="bg-gradient-to-r from-[#004080] via-[#008c54] to-[#f37021] bg-clip-text text-transparent">
                fait pour toi
              </span>{" "}
              ?
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              Réponds à quelques questions et découvre ton profil parmi les métiers RH :
              Recrutement, Paie, QVCT, Assistant RH ou Formation.
            </p>
            <Button
              onClick={() => navigate("/quiz/start")}
              className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-md"
            >
              Commencer le quiz
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Étapes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            {[
              {
                step: 1,
                title: "Tu fais le quiz",
                desc: "Questions rapides et intuitives",
                icon: Target,
                color: "#004080",
                bg: "bg-[#004080]/10",
                border: "border-[#004080]/20",
              },
              {
                step: 2,
                title: "Tu découvres ton profil",
                desc: "Résultat personnalisé et détaillé",
                icon: Sparkles,
                color: "#008c54",
                bg: "bg-[#008c54]/10",
                border: "border-[#008c54]/20",
              },
              {
                step: 3,
                title: "Tu prends contact",
                desc: "Pour avancer avec SUP des RH",
                icon: MessageSquare,
                color: "#f37021",
                bg: "bg-[#f37021]/10",
                border: "border-[#f37021]/20",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.step}
                  className="rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${item.step * 80}ms` }}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg} border ${item.border}`}
                    >
                      <Icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: item.color }}
                    >
                      Étape {item.step}
                    </div>
                    <p className="text-sm font-heading font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card
              className="rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: "300ms" }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-sm font-heading font-bold text-foreground">
                    Pourquoi ce quiz ?
                  </h2>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>
                      Tu t&apos;intéresses aux{" "}
                      <span className="text-foreground font-medium">Ressources Humaines</span> et tu
                      hésites sur ton orientation
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>
                      Ce quiz t&apos;aide à{" "}
                      <span className="text-foreground font-medium">identifier</span> le domaine RH
                      qui te correspond, en 2 minutes
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl border border-border bg-card hover:shadow-md hover:border-success/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: "380ms" }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                    <Play className="h-5 w-5 text-success" />
                  </div>
                  <h2 className="text-sm font-heading font-bold text-foreground">
                    Ce que tu obtiens
                  </h2>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    <span>
                      Un <span className="text-foreground font-medium">profil RH personnalisé</span>{" "}
                      avec score de correspondance
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    <span>
                      La <span className="text-foreground font-medium">fiche métier complète</span>{" "}
                      du domaine qui te correspond
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    <span>
                      Les <span className="text-foreground font-medium">contacts</span> pour
                      alternance ou stage chez SUP des RH
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
