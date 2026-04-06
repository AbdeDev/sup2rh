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
import { LanguageSwitcher } from "../components/LanguageSwitcher";
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

const DOMAIN_COLORS = [
  { bg: "rgba(0,64,128,0.08)", border: "rgba(0,64,128,0.25)", text: "#004080" },
  { bg: "rgba(0,140,84,0.08)", border: "rgba(0,140,84,0.25)", text: "#008c54" },
  { bg: "rgba(243,112,33,0.08)", border: "rgba(243,112,33,0.25)", text: "#c05000" },
  { bg: "rgba(107,33,168,0.08)", border: "rgba(107,33,168,0.25)", text: "#6b21a8" },
  { bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.25)", text: "#0891b2" },
  { bg: "rgba(190,24,93,0.08)", border: "rgba(190,24,93,0.25)", text: "#be185d" },
  { bg: "rgba(15,118,110,0.08)", border: "rgba(15,118,110,0.25)", text: "#0f766e" },
  { bg: "rgba(180,83,9,0.08)", border: "rgba(180,83,9,0.25)", text: "#b45309" },
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

const MARQUEE_PAUSE_MS = 2500;
const MARQUEE_SPEED = 0.8;

export function QuizLandingPage() {
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const domainsScrollRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<{ domaines: number; fiches: number } | null>(null);
  const [domainLabels, setDomainLabels] = useState<string[]>([]);
  const pauseAutoScrollUntil = useRef(0);

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

  // Auto-défilement du bandeau « Grands domaines RH » (pause au scroll manuel)
  useEffect(() => {
    const el = domainsScrollRef.current;
    if (!el) return;
    let rafId: number;
    function tick() {
      const target = domainsScrollRef.current;
      if (!target) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (Date.now() < pauseAutoScrollUntil.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const half = target.scrollWidth / 2;
      target.scrollLeft += MARQUEE_SPEED;
      if (target.scrollLeft >= half - 1) target.scrollLeft = 0;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [domainLabels]);

  function pauseDomainsMarquee() {
    pauseAutoScrollUntil.current = Date.now() + MARQUEE_PAUSE_MS;
  }

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
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                RH&MOI <span className="font-normal text-muted-foreground">by</span> SUP des RH
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f37021]/10 text-[#c05000] border border-[#f37021]/25 shrink-0">
                Quiz RH
              </span>
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
            <LanguageSwitcher />
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
        {/* Hero — full-width avec dégradé chaud */}
        <div className="relative overflow-hidden">
          {/* Fond décoratif */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/6 via-transparent to-[#008c54]/4" />
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-[#f37021]/[0.06] blur-[80px]" />
            <div className="absolute -bottom-10 -left-10 w-[400px] h-[400px] rounded-full bg-primary/[0.07] blur-[80px]" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 pt-14 pb-16 md:pt-20 md:pb-24 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            {/* Logo */}
            <div className="h-20 w-20 sm:h-24 sm:w-24 mb-6 transition-transform duration-300 hover:scale-105 drop-shadow-xl">
              <AppLogo className="h-full w-full object-contain" />
            </div>

            {/* Badge animé */}
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/25 px-4 py-2 text-[11px] font-semibold text-primary mb-6 shadow-sm">
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>
                Quiz gratuit · Résultat immédiat · Analyse IA
                {metrics != null && ` · ${metrics.fiches} fiches métiers`}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-[3.2rem] font-heading font-extrabold text-foreground mb-5 leading-[1.15] tracking-tight px-2">
              Quel métier RH est{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#004080] via-[#0066cc] to-[#008c54] bg-clip-text text-transparent">
                  fait pour toi ?
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[#004080] to-[#008c54] rounded-full opacity-30" />
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed px-2">
              Réponds à quelques questions et découvre ton{" "}
              <strong className="text-foreground font-semibold">grand domaine RH</strong> ainsi que
              les fiches métiers qui te correspondent, référencés par{" "}
              <strong className="text-foreground font-semibold">SUP des RH</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md sm:max-w-none">
              <Button
                onClick={() => navigate("/quiz/start")}
                className="w-full sm:w-auto h-13 px-8 text-base rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl gap-2.5 bg-gradient-to-r from-[#004080] to-[#0055aa] text-white hover:shadow-[#004080]/30 hover:shadow-2xl border-0"
              >
                Commencer le quiz
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/fiches")}
                className="w-full sm:w-auto h-13 px-6 text-sm rounded-2xl font-medium gap-2 border-border/80 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
              >
                <Briefcase className="h-4 w-4" />
                Explorer les fiches métier
              </Button>
            </div>

            {/* Stats chips */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 mt-12 w-full max-w-lg sm:max-w-none">
              {[
                {
                  val: metrics != null ? String(metrics.domaines) : "—",
                  lbl: "Domaines RH",
                  color: "#004080",
                },
                {
                  val: metrics != null ? String(metrics.fiches) : "—",
                  lbl: "Fiches métier",
                  color: "#008c54",
                },
                { val: "~2 min", lbl: "Durée", color: "#f37021" },
                { val: "100%", lbl: "Gratuit", color: "#6b21a8" },
                { val: "IA", lbl: "Analyse", color: "#0891b2" },
              ].map((s) => (
                <div
                  key={s.lbl}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <p
                    className="text-base sm:text-lg font-heading font-extrabold"
                    style={{ color: s.color }}
                  >
                    {s.val}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">
                    {s.lbl}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grands domaines RH */}
        <div className="border-y border-border bg-gradient-to-r from-card via-muted/20 to-card py-6 sm:py-8 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 text-center mb-4">
            <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
              Grands domaines RH
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Ces domaines sont explorés dans le quiz : selon tes réponses, tu seras orienté vers
              l’un d’entre eux et les fiches métiers associées.
            </p>
          </div>
          <div
            ref={domainsScrollRef}
            className="overflow-x-auto hide-scrollbar w-full px-3 sm:px-4 scroll-smooth"
            style={{ scrollSnapType: "x mandatory" }}
            onWheel={pauseDomainsMarquee}
            onTouchStart={pauseDomainsMarquee}
            onMouseDown={pauseDomainsMarquee}
          >
            <div className="flex gap-3 w-max min-w-full">
              {domainLabels.length > 0
                ? [...domainLabels, ...domainLabels].map((label, i) => {
                    const staticDom = DOMAINS.find((d) => d.label === label);
                    const color = DOMAIN_COLORS[i % DOMAIN_COLORS.length];
                    return (
                      <span
                        key={`${label}-${i}`}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 snap-start"
                        style={{
                          background: color.bg,
                          border: `1px solid ${color.border}`,
                          color: color.text,
                        }}
                      >
                        {staticDom ? `${staticDom.emoji} ` : ""}
                        {label}
                      </span>
                    );
                  })
                : [...DOMAINS, ...DOMAINS].map((d, i) => {
                    const color = DOMAIN_COLORS[i % DOMAIN_COLORS.length];
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 snap-start"
                        style={{
                          background: color.bg,
                          border: `1px solid ${color.border}`,
                          color: color.text,
                        }}
                      >
                        {d.emoji} {d.label}
                      </span>
                    );
                  })}
            </div>
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
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-[#004080]/8 via-card to-[#008c54]/5 p-6 sm:p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "400ms" }}
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-5">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-3">
              Prêt à découvrir ton profil RH ?
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
