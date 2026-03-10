import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  User,
  LogOut,
  Clock,
  Sparkles,
  Target,
  MessageSquare,
  BarChart3,
  Briefcase,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { supabase } from "../lib/supabase";
import { getJobs } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { AppLogo } from "../components/AppLogo";

const STEPS = [
  {
    step: 1,
    title: "Réponds aux questions",
    desc: "Quiz rapide, intuitif, 2 minutes chrono",
    icon: Target,
    color: "#004080",
    bg: "bg-[#004080]/10",
    border: "border-[#004080]/20",
  },
  {
    step: 2,
    title: "Découvres ton domaine RH",
    desc: "18 grands domaines analysés par l'IA",
    icon: BarChart3,
    color: "#008c54",
    bg: "bg-[#008c54]/10",
    border: "border-[#008c54]/20",
  },
  {
    step: 3,
    title: "Accède à ta fiche métier",
    desc: "Salaire, missions, formations, vidéo",
    icon: BookOpen,
    color: "#f37021",
    bg: "bg-[#f37021]/10",
    border: "border-[#f37021]/20",
  },
  {
    step: 4,
    title: "Prends contact",
    desc: "Alternance ou stage chez SUP des RH",
    icon: MessageSquare,
    color: "#6b21a8",
    bg: "bg-purple-100 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800/40",
  },
];

const DOMAINS = [
  { emoji: "🎯", label: "Recrutement & Talents" },
  { emoji: "📚", label: "Formation & Compétences" },
  { emoji: "💰", label: "Paie & Rémunération" },
  { emoji: "🤝", label: "Relations Sociales" },
  { emoji: "💻", label: "SIRH & Digital RH" },
  { emoji: "🌈", label: "Diversité & Inclusion" },
  { emoji: "🌿", label: "QVCT & Bien-être" },
  { emoji: "🚀", label: "Gestion des Talents" },
];

export function QuizLandingPage() {
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<{ domaines: number; fiches: number } | null>(null);
  const [domainLabels, setDomainLabels] = useState<string[]>([]);

  useEffect(() => {
    getJobs()
      .then(({ items }) => {
        const categories = new Set(items.map((j) => j.category).filter(Boolean));
        setMetrics({ domaines: categories.size, fiches: items.length });
        setDomainLabels(Array.from(categories) as string[]);
      })
      .catch(() => setMetrics(null));
  }, []);

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
      {/* Header */}
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
              onClick={() => navigate("/fiches")}
            >
              <Briefcase className="h-3.5 w-3.5 mr-1.5" />
              Fiches métier
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
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-card py-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors rounded-lg mx-0.5 sm:hidden"
                    style={{ width: "calc(100% - 4px)" }}
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/fiches");
                    }}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    Fiches métier
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
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#004080]/8 via-background to-[#008c54]/5 pointer-events-none" />
          <div
            className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full opacity-[0.04] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #f37021, transparent)",
              transform: "translate(30%, -30%)",
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            {/* Logo tout en haut, au-dessus du badge */}
            <div className="flex flex-col items-center w-full">
              <div className="inline-flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center mb-5 transition-transform duration-300 hover:scale-110 drop-shadow-lg shrink-0">
                <AppLogo className="h-24 w-24 sm:h-28 sm:w-28 object-contain" />
              </div>
              <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-[11px] font-semibold text-primary mb-5">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>
                  Quiz gratuit · Résultat immédiat
                  {metrics != null && (
                    <>
                      {" "}
                      · {metrics.domaines} domaine{metrics.domaines !== 1 ? "s" : ""} RH ·{" "}
                      {metrics.fiches} fiche{metrics.fiches !== 1 ? "s" : ""}
                    </>
                  )}
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-foreground mb-5 leading-tight px-1">
              Quel métier RH est{" "}
              <span className="bg-gradient-to-r from-[#004080] via-[#008c54] to-[#f37021] bg-clip-text text-transparent">
                fait pour toi ?
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed px-1">
              Réponds à quelques questions et découvre ton{" "}
              <strong className="text-foreground">grand domaine RH</strong> et les fiches métiers
              qui te correspondent, référencés par{" "}
              <strong className="text-foreground">SUP des RH</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate("/quiz/start")}
                className="h-12 px-8 text-base rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg gap-2"
                style={{ backgroundColor: "#004080", color: "#fff" }}
              >
                Commencer le quiz
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/fiches")}
                className="h-12 px-6 text-sm rounded-xl font-medium gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Explorer les fiches métier
              </Button>
            </div>

            {/* Stats — métriques réelles + fixes */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-10 pt-8 border-t border-border/60">
              <div className="text-center">
                <p className="text-lg font-heading font-bold text-foreground">
                  {metrics != null ? String(metrics.domaines) : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">Domaines RH</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-heading font-bold text-foreground">
                  {metrics != null ? String(metrics.fiches) : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">Fiches métier</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-heading font-bold text-foreground">~2 min</p>
                <p className="text-[11px] text-muted-foreground">Durée du quiz</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-heading font-bold text-foreground">100%</p>
                <p className="text-[11px] text-muted-foreground">Gratuit</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-heading font-bold text-foreground">IA</p>
                <p className="text-[11px] text-muted-foreground">Analyse instantanée</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grands domaines RH — titre + bandeau */}
        <div className="border-y border-border/60 bg-muted/20 py-6 sm:py-8 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 text-center mb-4">
            <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
              Grands domaines RH
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Ces domaines sont explorés dans le quiz : selon tes réponses, tu seras orienté·e vers
              l’un d’entre eux et les fiches métiers associées.
            </p>
          </div>
          <div className="flex gap-3 animate-scroll px-4" style={{ width: "max-content" }}>
            {domainLabels.length > 0
              ? [...domainLabels, ...domainLabels].map((label, i) => {
                  const staticDom = DOMAINS.find((d) => d.label === label);
                  return (
                    <span
                      key={`${label}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0"
                    >
                      {staticDom ? `${staticDom.emoji} ` : ""}
                      {label}
                    </span>
                  );
                })
              : [...DOMAINS, ...DOMAINS].map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0"
                  >
                    {d.emoji} {d.label}
                  </span>
                ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-14">
          {/* Étapes */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-xl font-heading font-bold text-foreground">
                Comment ça marche ?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Quatre étapes simples</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.step}
                    className="rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 group"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} border ${item.border} transition-transform group-hover:scale-110 duration-300`}
                        >
                          <Icon className="h-5 w-5" style={{ color: item.color }} />
                        </div>
                        <span
                          className="text-2xl font-heading font-black opacity-10"
                          style={{ color: item.color }}
                        >
                          {item.step}
                        </span>
                      </div>
                      <p className="text-sm font-heading font-semibold text-foreground leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* CTA final */}
          <div
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#004080]/8 via-card to-[#008c54]/5 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "400ms" }}
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-5">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-3">
              Prêt·e à découvrir ton profil RH ?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Gratuit, sans engagement, résultat personnalisé en moins de 2 minutes.
            </p>
            <Button
              onClick={() => navigate("/quiz/start")}
              className="h-12 px-8 text-base rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-md gap-2"
              style={{ backgroundColor: "#004080", color: "#fff" }}
            >
              Lancer le quiz maintenant
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
