import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, User, Sparkles, CheckCircle2 } from "lucide-react";

import { toast } from "sonner";
import {
  getQuizSession,
  analyzeQuiz,
  submitContactRequest,
  getJobs,
  type AnalysisResult,
  type QuizSessionWithAnswers,
  type JobFiche,
  type JobFicheIndicator,
  getMe,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { ThemeToggle } from "../components/ThemeToggle";
import { AppLogo } from "../components/AppLogo";
import { ChartContainer, type ChartConfig } from "../components/ui/chart";

/** Formate une description qui peut contenir des puces "•" en liste visuelle */
function FormatDescription({ text }: { text: string }) {
  const parts = text.split(/\s*•\s*/).filter(Boolean);
  if (parts.length <= 1) {
    return <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }
  const intro = parts[0].trim();
  const bullets = parts.slice(1);
  return (
    <div className="space-y-2">
      {intro && <p className="text-sm text-foreground/90 leading-relaxed">{intro}</p>}
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-sm text-foreground/90 leading-relaxed">{b.trim()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateSession = location.state?.session as QuizSessionWithAnswers | undefined;
  const stateAnalysis = location.state?.analysis as AnalysisResult | undefined;
  const stateSummary = location.state?.sessionSummary as
    | {
        id: string;
        finalJobId: string | null;
        scores: Record<string, number> | null;
        answerCount?: number;
      }
    | undefined;
  const hasFullState = Boolean(stateSession && stateAnalysis);
  const hasSummary = Boolean(stateSummary?.finalJobId && stateSummary?.scores);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(stateAnalysis || null);
  const [session, setSession] = useState<QuizSessionWithAnswers | null>(stateSession || null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(() => Boolean(id && !hasFullState && !hasSummary));
  const [error, setError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [showAllScores, setShowAllScores] = useState(false);
  const [allJobs, setAllJobs] = useState<JobFiche[]>([]);
  /** Domaine RH sélectionné (pour le graphique et le carrousel) */
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const buildResultFromScores = useCallback(
    async (finalJobId: string, scores: Record<string, number>, answerCount?: number) => {
      const { items } = await getJobs();
      setAllJobs(items);
      const job = items.find((j) => j.id === finalJobId) as JobFiche | undefined;
      const topScore = Math.max(...Object.values(scores), 0.5);
      const result: AnalysisResult = {
        jobId: finalJobId,
        confidence: topScore,
        explanation: job
          ? `Vos réponses indiquent une affinité avec le profil « ${job.name} ».`
          : "Profil analysé avec succès.",
        scores,
        job: job ?? undefined,
      };
      if (result.jobId && (!result.job || !result.job.description)) {
        const fullJob = items.find((j) => j.id === result.jobId) as JobFiche | undefined;
        if (fullJob) result.job = fullJob;
      }
      setAnalysis(result);
      setSession((prev) => {
        if (prev) return prev;
        return {
          id: id!,
          userId: "",
          createdAt: "",
          finalJobId,
          scores,
          answers: Array.from({ length: answerCount ?? 0 }, (_, i) => ({
            id: String(i),
            questionId: "",
            answerId: null,
            textValue: null,
            createdAt: "",
          })),
        };
      });
    },
    [id],
  );

  const loadResult = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const s = await getQuizSession(id);
      setSession(s);
      let result: AnalysisResult | null = null;

      if (s.finalJobId && s.scores && Object.keys(s.scores).length > 0) {
        const { items } = await getJobs();
        setAllJobs(items);
        const job = items.find((j) => j.id === s.finalJobId!) as JobFiche | undefined;
        const topScore = Math.max(...Object.values(s.scores), 0.5);
        result = {
          jobId: s.finalJobId,
          confidence: topScore,
          explanation: job
            ? `Vos réponses indiquent une affinité avec le profil « ${job.name} ».`
            : "Profil analysé avec succès.",
          scores: s.scores,
          job: job ?? undefined,
        };
      } else if (s.finalJobId) {
        try {
          result = await analyzeQuiz(id);
        } catch {
          setError("Impossible d'analyser cette session. Réessaie plus tard.");
        }
      }

      if (result) {
        if (result.jobId && (!result.job || !result.job.description)) {
          try {
            const { items } = await getJobs();
            const fullJob = items.find((j) => j.id === result!.jobId) as JobFiche | undefined;
            if (fullJob) result = { ...result, job: fullJob };
          } catch {
            /* proceed without full fiche */
          }
        }
        setAnalysis(result);
      } else if (!s.finalJobId) {
        setError("Quiz non terminé. Complète le quiz pour voir ton résultat.");
      } else {
        setError("Résultats non disponibles pour cette session.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible de charger les résultats.";
      setError(msg);
      console.error("Erreur chargement résultat:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const didLoadRef = useRef(false);

  useEffect(() => {
    if (!id || didLoadRef.current) return;
    if (hasFullState) return;

    didLoadRef.current = true;

    if (hasSummary && stateSummary!.finalJobId && stateSummary!.scores) {
      setLoading(true);
      buildResultFromScores(
        stateSummary!.finalJobId,
        stateSummary!.scores as Record<string, number>,
        stateSummary!.answerCount,
      )
        .catch((e) => {
          console.error("Erreur construction résultat depuis summary:", e);
          loadResult();
        })
        .finally(() => setLoading(false));
      return;
    }

    loadResult();
  }, [id, hasFullState, hasSummary, loadResult, buildResultFromScores, stateSummary]);

  useEffect(() => {
    getMe()
      .then((userData) => setUser({ email: userData.email }))
      .catch(console.error);
  }, []);

  const jobLabel = (jid: string) => jid.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  /** Graphique par domaines RH : un score max par domaine (parmi les jobs qui ont un score) */
  const domainChartData = useMemo(() => {
    const scores = analysis?.scores;
    if (!scores || typeof scores !== "object" || allJobs.length === 0) return [];
    const byCategory: Record<string, number> = {};
    for (const [jobId, score] of Object.entries(scores)) {
      const job = allJobs.find((j) => j.id === jobId);
      const cat = job?.category?.trim();
      if (!cat) continue;
      const current = byCategory[cat] ?? 0;
      byCategory[cat] = Math.max(current, Number(score) || 0);
    }
    const mainCategory = analysis?.job?.category ?? null;
    const entries = Object.entries(byCategory)
      .map(([category, value]) => ({
        category,
        value: Math.round(value * 100),
        isMain: category === mainCategory,
      }))
      .sort((a, b) => b.value - a.value);
    return entries;
  }, [analysis, allJobs]);

  /** Domaine actif (sélection utilisateur ou domaine du résultat principal) */
  const activeCategory =
    selectedCategory ?? analysis?.job?.category ?? domainChartData[0]?.category ?? null;

  /** Fiches métier du domaine sélectionné */
  const categoryJobs = useMemo(() => {
    if (!activeCategory || allJobs.length === 0) return [];
    return allJobs.filter((j) => j.category === activeCategory);
  }, [activeCategory, allJobs]);

  /** Job sélectionné dans le carrousel ou job principal pour la fiche détaillée */
  const activeJobId = selectedJobId ?? analysis?.jobId ?? null;
  const selectedJob = useMemo(() => {
    if (!activeJobId) return analysis?.job ?? null;
    return (allJobs.find((j) => j.id === activeJobId) ?? analysis?.job) as JobFiche | null;
  }, [activeJobId, allJobs, analysis]);

  const INITIAL_VISIBLE = 5;
  const visibleChartData = showAllScores
    ? domainChartData
    : domainChartData.slice(0, INITIAL_VISIBLE);
  const hasMoreScores = domainChartData.length > INITIAL_VISIBLE;
  const answerCount = session?.answers?.length ?? 0;
  const confidencePercent = Math.round((analysis?.confidence ?? 0) * 100);
  const remainingPercent = Math.max(0, 100 - confidencePercent);
  const topJobLabel =
    analysis?.job?.name ?? (analysis?.jobId ? jobLabel(analysis.jobId) : "Métier RH");
  const fiche = selectedJob ?? analysis?.job ?? null;

  const chartConfig: ChartConfig = {
    value: { label: "Correspondance", color: "--chart-1" },
  };

  async function handleContact() {
    if (!session || !analysis) return;
    setContactLoading(true);
    try {
      await submitContactRequest({
        sessionId: session.id,
        email: user?.email,
        jobId: analysis.jobId,
        explanation: analysis.explanation,
        scores: analysis.scores,
      });
      toast.success("Demande envoyée ! L'équipe SUP des RH te contactera bientôt.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi");
    } finally {
      setContactLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement des résultats…</p>
      </div>
    );
  }

  if (!analysis || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-2">
            <Sparkles className="h-8 w-8 text-destructive" />
          </div>
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
            <p className="text-sm font-heading font-bold text-foreground mb-1.5">
              {error || "Résultats indisponibles"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vérifie que tu es connecté avec le bon compte et que l&apos;API est démarrée.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {error && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-sm rounded-xl"
                onClick={loadResult}
              >
                Réessayer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-sm rounded-xl"
              onClick={() => navigate("/sessions")}
            >
              Mes sessions
            </Button>
            <Button
              size="sm"
              className="h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
              onClick={() => navigate("/quiz")}
            >
              Accueil quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="hidden sm:block">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                Rh et moi <span className="font-normal text-muted-foreground">by</span> SUP des RH
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Résultat</p>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-border rounded-xl"
              onClick={() => navigate("/sessions")}
            >
              Mes sessions
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
          {/* Résultat principal — Grand domaine RH */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 border border-success/25 mb-5 transition-transform duration-200 hover:scale-105">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              {/* Domaine = titre principal */}
              {analysis?.job?.category ? (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Ton domaine RH
                  </p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-2 leading-tight">
                    {analysis.job.category}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-3">
                    Métier le plus proche :{" "}
                    <span className="font-semibold text-foreground">{topJobLabel}</span>
                  </p>
                </>
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                  {topJobLabel}
                </h1>
              )}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm font-semibold text-primary">
                  {confidencePercent}% de correspondance
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs text-muted-foreground">
                  {answerCount} question{answerCount > 1 ? "s" : ""} répondue
                  {answerCount > 1 ? "s" : ""}
                </span>
                {categoryJobs.length > 1 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#008c54]/10 border border-[#008c54]/20 px-3 py-1 text-xs font-semibold text-[#008c54]">
                    {categoryJobs.length} fiches dans ce domaine
                  </span>
                )}
              </div>
              {!!remainingPercent && (
                <p className="mt-3 text-xs text-muted-foreground max-w-md mx-auto">
                  Il reste {remainingPercent}% de marge pour explorer d&apos;autres domaines RH.
                </p>
              )}
            </div>
          </div>

          {/* Profil + Statistiques rapides */}
          {user && (
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "50ms" }}
            >
              <Card className="border border-border bg-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Profil
                    </p>
                    <p className="text-xs text-foreground truncate">{user.email}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-success/15 border border-success/25 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </p>
                    <p className="text-xs text-foreground">Quiz complété</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange/15 border border-orange/25 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-orange" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Métiers analysés
                    </p>
                    <p className="text-xs text-foreground">
                      {domainChartData.length} domaine{domainChartData.length > 1 ? "s" : ""} RH
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Comparaison des domaines RH — une barre par domaine */}
          {domainChartData.length > 0 && (
            <Card
              className="border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "100ms" }}
            >
              <CardContent className="p-5 md:p-6">
                <div className="mb-5">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Comparaison des domaines RH
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {domainChartData.length} domaine{domainChartData.length > 1 ? "s" : ""} — Clique
                    sur une barre pour voir les fiches métier du domaine.
                  </p>
                  {activeCategory && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#008c54]/10 border border-[#008c54]/20 px-3 py-1 text-xs font-semibold text-[#008c54]">
                        <Briefcase className="h-3 w-3" />
                        {activeCategory}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {categoryJobs.length} fiche{categoryJobs.length > 1 ? "s" : ""} dans ce
                        domaine
                      </span>
                      {selectedCategory && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(null)}
                          className="text-[10px] text-primary hover:underline ml-1"
                        >
                          ← Retour au domaine principal
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <ChartContainer
                  config={chartConfig}
                  className="w-full rounded-xl border border-border bg-muted/30 p-4 md:p-6"
                >
                  <div
                    className={`flex items-end gap-2 sm:gap-3 md:gap-4 ${visibleChartData.length > 8 ? "overflow-x-auto pb-2" : "justify-center"}`}
                    style={{ minHeight: "200px" }}
                  >
                    {visibleChartData.map((item, idx) => {
                      const maxVal = domainChartData[0]?.value || 100;
                      const barHeight = Math.max((item.value / Math.max(maxVal, 1)) * 160, 16);
                      const barColors = [
                        "#004080",
                        "#008c54",
                        "#f37021",
                        "#0d5aa7",
                        "#16a34a",
                        "#d97706",
                        "#3b82f6",
                        "#10b981",
                        "#ef4444",
                        "#8b5cf6",
                        "#6b7280",
                        "#ec4899",
                        "#14b8a6",
                        "#f59e0b",
                        "#6366f1",
                      ];
                      const barColor = item.isMain
                        ? "#004080"
                        : (barColors[idx % barColors.length] ?? "#6b7280");

                      const isSelected = item.category === activeCategory;
                      const labelShort =
                        item.category.length > 18
                          ? item.category.slice(0, 16) + "…"
                          : item.category;
                      return (
                        <button
                          type="button"
                          key={item.category}
                          onClick={() =>
                            setSelectedCategory(
                              item.category === activeCategory && !selectedCategory
                                ? null
                                : item.category,
                            )
                          }
                          title={`Voir les fiches : ${item.category}`}
                          className="flex flex-col items-center gap-1.5 animate-in fade-in cursor-pointer group transition-transform duration-150 hover:scale-105 focus:outline-none"
                          style={{
                            animationDelay: `${idx * 50}ms`,
                            minWidth: visibleChartData.length > 8 ? "56px" : undefined,
                            flex: visibleChartData.length <= 8 ? "1 1 0" : undefined,
                            maxWidth: "120px",
                            background: "none",
                            border: "none",
                            padding: 0,
                          }}
                        >
                          <span
                            className={`text-[10px] sm:text-xs tabular-nums font-bold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {item.value}%
                          </span>
                          <div
                            className="w-full flex flex-col justify-end"
                            style={{ height: "160px" }}
                          >
                            <div
                              className="w-full rounded-t-lg transition-all duration-700 ease-out"
                              style={{
                                height: `${barHeight}px`,
                                background: isSelected
                                  ? `linear-gradient(180deg, ${barColor} 0%, ${barColor}cc 100%)`
                                  : `linear-gradient(180deg, ${barColor}55 0%, ${barColor}33 100%)`,
                                boxShadow: isSelected ? `0 -4px 16px ${barColor}44` : undefined,
                                outline: isSelected ? `2px solid ${barColor}` : undefined,
                                outlineOffset: "2px",
                                borderRadius: "6px 6px 0 0",
                                minWidth: "24px",
                              }}
                            />
                          </div>
                          <span
                            className={`text-[9px] sm:text-[10px] text-center leading-tight line-clamp-2 ${
                              isSelected
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                            }`}
                            title={item.category}
                            style={{ minHeight: "24px" }}
                          >
                            {labelShort}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {hasMoreScores && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        className="text-xs font-medium transition-colors hover:underline"
                        style={{ color: "#004080" }}
                        onClick={() => setShowAllScores(!showAllScores)}
                      >
                        {showAllScores
                          ? "Voir moins"
                          : `Voir les ${domainChartData.length - INITIAL_VISIBLE} autres domaines`}
                      </button>
                    </div>
                  )}
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Carrousel fiches du domaine ── toujours visible si catégorie connue */}
          {categoryJobs.length > 0 && (
            <Card
              className="border border-[#008c54]/25 bg-card animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "140ms" }}
            >
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-[#008c54]/15 border border-[#008c54]/25 flex items-center justify-center shrink-0">
                      <svg
                        className="h-4 w-4 text-[#008c54]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-heading font-semibold text-foreground truncate">
                        {activeCategory ?? "Fiches de ce domaine"}
                      </h2>
                      <p className="text-[10px] text-muted-foreground">
                        {categoryJobs.length === 1
                          ? "1 fiche dans ce domaine"
                          : `${categoryJobs.length} fiches · Glisse pour explorer →`}
                      </p>
                    </div>
                  </div>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="text-[10px] text-primary hover:underline shrink-0"
                    >
                      ← Retour au domaine principal
                    </button>
                  )}
                </div>
                <div
                  className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar"
                  style={{ scrollSnapType: "x mandatory" }}
                >
                  {categoryJobs.map((j) => {
                    const isActive = j.id === activeJobId;
                    const isTop = j.id === analysis?.jobId;
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setSelectedJobId(j.id === analysis?.jobId ? null : j.id)}
                        className="shrink-0 text-left rounded-xl border transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary active:scale-[0.98]"
                        style={{
                          width: categoryJobs.length === 1 ? "100%" : "clamp(200px, 60vw, 240px)",
                          scrollSnapAlign: "start",
                          borderColor: isActive ? "#004080" : "var(--border)",
                          background: isActive ? "rgba(0,64,128,0.07)" : "var(--card)",
                          padding: "16px",
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className="h-7 w-7 rounded-md flex items-center justify-center"
                            style={{ background: isActive ? "#004080" : "rgba(0,64,128,0.1)" }}
                          >
                            <Sparkles
                              className="h-3.5 w-3.5"
                              style={{ color: isActive ? "#fff" : "#004080" }}
                            />
                          </div>
                          {isTop && (
                            <span className="text-[9px] font-bold text-[#008c54] bg-[#008c54]/10 rounded-full px-2 py-0.5">
                              ✓ Recommandé
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-snug mb-2 line-clamp-2">
                          {j.name}
                        </p>
                        {j.salary && (
                          <p className="text-[10px] text-muted-foreground">💰 {j.salary}</p>
                        )}
                        {j.hiringRate != null && (
                          <p className="text-[10px] text-muted-foreground">
                            📊 {j.hiringRate}% embauche
                          </p>
                        )}
                        {j.description && (
                          <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {j.description}
                          </p>
                        )}
                        {isActive && (
                          <p className="text-[9px] font-semibold text-primary mt-2">
                            → Fiche détaillée ci-dessous
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fiche métier RH */}
          <Card
            className="border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "150ms" }}
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-semibold text-foreground">
                    {fiche?.name ?? "Fiche métier RH"}
                  </h2>
                  {fiche?.category && (
                    <p className="text-[10px] text-muted-foreground">{fiche.category}</p>
                  )}
                </div>
              </div>
              <div className="space-y-5">
                {fiche?.description && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Description du métier
                    </p>
                    <FormatDescription text={fiche.description} />
                  </div>
                )}
                {(fiche?.salary ?? fiche?.hiringRate ?? fiche?.turnoverRate) && (
                  <>
                    <Separator className="bg-border" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {fiche?.salary && (
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Salaire
                          </p>
                          <p className="text-sm font-semibold text-foreground">{fiche.salary}</p>
                        </div>
                      )}
                      {fiche?.hiringRate != null && (
                        <div className="rounded-lg border border-success/20 bg-success/5 p-3">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Taux d&apos;embauche
                          </p>
                          <p className="text-sm font-semibold text-success">{fiche.hiringRate} %</p>
                        </div>
                      )}
                      {fiche?.turnoverRate != null && (
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Turnover
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {fiche.turnoverRate} %
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                <Separator className="bg-border" />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Pourquoi ce métier te correspond
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {analysis.explanation}
                  </p>
                </div>
                {Array.isArray(fiche?.indicators) && fiche.indicators.length > 0 && (
                  <>
                    <Separator className="bg-border" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Autres indicateurs
                      </p>
                      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2">
                        {fiche.indicators.map((ind, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                          >
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 break-words">
                              {ind.label}
                            </p>
                            <p className="text-xs font-semibold text-foreground break-words">
                              {String(ind.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {fiche?.videoUrl && (
                  <>
                    <Separator className="bg-border" />
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Vidéo explicative
                      </p>
                      <div className="rounded-xl overflow-hidden border border-border bg-muted/20 w-full aspect-video max-w-xl mb-2">
                        {(() => {
                          const url = fiche.videoUrl!;
                          const ytMatch = url.match(
                            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
                          );
                          const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                          if (ytMatch) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`}
                                title="Vidéo du métier"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          }
                          if (vimeoMatch) {
                            return (
                              <iframe
                                src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                                title="Vidéo du métier"
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          }
                          return (
                            <video src={url} controls className="w-full h-full">
                              <track kind="captions" />
                            </video>
                          );
                        })()}
                      </div>
                      <a
                        href={fiche.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                      >
                        Voir la vidéo du métier →
                      </a>
                    </div>
                  </>
                )}
                {fiche?.id && (
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={() => navigate(`/fiches/${fiche.id}`)}
                    >
                      Voir la fiche complète
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CTA Contact */}
          <Card
            className="border border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "200ms" }}
          >
            <CardContent className="p-5 md:p-8 text-center">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                Intéressé par ce métier ?
              </h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                L&apos;équipe SUP des RH peut t&apos;aider à trouver une alternance ou un stage dans
                ce domaine.
              </p>
              <Button
                onClick={handleContact}
                disabled={contactLoading}
                className="h-11 px-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                {contactLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  "Être contacté par SUP des RH"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Actions secondaires */}
          <div
            className="flex gap-3 justify-center pb-6 animate-in fade-in duration-500"
            style={{ animationDelay: "300ms" }}
          >
            <Button
              variant="outline"
              className="h-9 px-5 text-xs border-border text-muted-foreground hover:text-foreground transition-all duration-200"
              onClick={() => navigate("/quiz/start")}
            >
              Nouveau quiz
            </Button>
            <Button
              variant="outline"
              className="h-9 px-5 text-xs border-border text-muted-foreground hover:text-foreground transition-all duration-200"
              onClick={() => navigate("/sessions")}
            >
              Mes sessions
            </Button>
          </div>
        </div>
      </main>

      {/* Modal détail fiche — sans quitter la page */}
      {ficheModalJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setFicheModalJob(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fiche-modal-title"
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="fiche-modal-title"
                    className="text-base sm:text-lg font-heading font-bold text-foreground truncate"
                  >
                    {ficheModalJob.name}
                  </h2>
                  {ficheModalJob.category && (
                    <p className="text-xs text-muted-foreground truncate">
                      {ficheModalJob.category}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
                onClick={() => setFicheModalJob(null)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {ficheModalJob.description && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Description
                  </p>
                  <FormatDescription text={ficheModalJob.description} />
                </div>
              )}
              {(ficheModalJob.salary ||
                ficheModalJob.hiringRate != null ||
                ficheModalJob.turnoverRate != null) && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Indicateurs
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {ficheModalJob.salary && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                        {ficheModalJob.salary}
                      </span>
                    )}
                    {ficheModalJob.hiringRate != null && (
                      <span className="text-sm text-foreground">
                        Taux d&apos;embauche : {ficheModalJob.hiringRate}%
                      </span>
                    )}
                    {ficheModalJob.turnoverRate != null && (
                      <span className="text-sm text-muted-foreground">
                        Turnover : {ficheModalJob.turnoverRate}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              {Array.isArray(ficheModalJob.indicators) && ficheModalJob.indicators.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Autres indicateurs
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ficheModalJob.indicators.map((ind: JobFicheIndicator, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                      >
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 break-words">
                          {ind.label}
                        </p>
                        <p className="text-xs font-semibold text-foreground break-words">
                          {String(ind.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ficheModalJob.videoUrl &&
                (() => {
                  const rawUrl = (ficheModalJob.videoUrl as string).trim();
                  const yt =
                    rawUrl &&
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/.exec(
                      rawUrl,
                    );
                  const vimeo = rawUrl && /vimeo\.com\/(?:video\/)?(\d+)/.exec(rawUrl);
                  const embedUrl = yt
                    ? `https://www.youtube.com/embed/${yt[1]}?rel=0`
                    : vimeo
                      ? `https://player.vimeo.com/video/${vimeo[1]}`
                      : null;
                  const isAbsolute = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
                  return (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Vidéo explicative
                      </p>
                      <div className="rounded-xl overflow-hidden border border-border bg-muted/20 aspect-video w-full">
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title="Vidéo du métier"
                            className="w-full h-full min-h-[180px]"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : isAbsolute ? (
                          <video
                            src={rawUrl}
                            controls
                            className="w-full h-full min-h-[180px]"
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full min-h-[180px] flex items-center justify-center bg-muted/30 text-muted-foreground text-xs p-3 text-center">
                            Utilise le bouton ci-dessous pour ouvrir la vidéo.
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          rawUrl && window.open(rawUrl, "_blank", "noopener,noreferrer")
                        }
                        className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        Ouvrir la vidéo dans un nouvel onglet
                      </button>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
