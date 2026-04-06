import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, User, Sparkles, CheckCircle2, X, ExternalLink, Briefcase } from "lucide-react";

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
import { LanguageSwitcher } from "../components/LanguageSwitcher";
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
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [showAllScores, setShowAllScores] = useState(false);
  const [allJobs, setAllJobs] = useState<JobFiche[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [ficheModalJob, setFicheModalJob] = useState<JobFiche | null>(null);

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

  // Charge les jobs si on arrive avec stateAnalysis (depuis QuizStartPage) — allJobs serait vide sinon
  useEffect(() => {
    if (allJobs.length > 0) return;
    if (!analysis) return;
    getJobs()
      .then(({ items }) => setAllJobs(items))
      .catch(console.error);
  }, [analysis, allJobs.length]);

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
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0) || 1;
    const mainCategory = analysis?.job?.category ?? null;
    return Object.entries(byCategory)
      .map(([category, value]) => ({
        category,
        value: Math.round((value / total) * 100),
        isMain: category === mainCategory,
      }))
      .sort((a, b) => b.value - a.value);
  }, [analysis, allJobs]);

  /** Fallback : graphique par métier quand aucun domaine n'est disponible */
  const scoresChartDataFallback = useMemo(() => {
    const scores = analysis?.scores;
    if (!scores || typeof scores !== "object") return [];
    const entries = Object.entries(scores);
    if (entries.length === 0) return [];
    const total = entries.reduce((s, [, v]) => s + (Number(v) || 0), 0) || 1;
    const sorted = [...entries].sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
    return sorted.map(([jId, value]) => ({
      jobId: jId,
      label: jId === analysis.jobId && analysis.job?.name ? analysis.job.name : jobLabel(jId),
      value: Math.round(((Number(value) || 0) / total) * 100),
      isMain: jId === analysis.jobId,
    }));
  }, [analysis]);

  const hasDomains = domainChartData.length > 0;
  const activeCategory =
    selectedCategory ?? analysis?.job?.category ?? domainChartData[0]?.category ?? null;

  const categoryJobs = useMemo(() => {
    if (!activeCategory || allJobs.length === 0) return [];
    return allJobs.filter((j) => j.category === activeCategory);
  }, [activeCategory, allJobs]);

  /** Fallback carrousel : top métiers par score quand pas de domaine sélectionnable */
  const fallbackJobs = useMemo(() => {
    const scores = analysis?.scores;
    if (!scores || allJobs.length === 0) return [];
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      .slice(0, 12)
      .map(([jobId]) => allJobs.find((j) => j.id === jobId))
      .filter(Boolean) as JobFiche[];
    return sorted;
  }, [analysis?.scores, allJobs]);

  /** En mode domaines : fiches du domaine sélectionné (recommandée en tête). Sinon : top métiers. */
  const carouselJobs = useMemo(() => {
    const base = hasDomains ? categoryJobs : fallbackJobs;
    if (!analysis?.jobId) return base;
    const recommended = base.find((j) => j.id === analysis.jobId);
    if (!recommended) return base;
    return [recommended, ...base.filter((j) => j.id !== analysis.jobId)];
  }, [hasDomains, categoryJobs, fallbackJobs, analysis?.jobId]);

  const activeJobId = selectedJobId ?? analysis?.jobId ?? null;
  const selectedJob = useMemo(() => {
    if (!activeJobId) return analysis?.job ?? null;
    return (allJobs.find((j) => j.id === activeJobId) ?? analysis?.job) as JobFiche | null;
  }, [activeJobId, allJobs, analysis]);

  const chartDataForDisplay = hasDomains ? domainChartData : scoresChartDataFallback;
  // Top 5 domaines/emplois par défaut, possibilité d'afficher tous les résultats
  const visibleChartData = showAllScores ? chartDataForDisplay : chartDataForDisplay.slice(0, 5);
  const hasMoreScores = chartDataForDisplay.length > 5;
  const chartCount = chartDataForDisplay.length;
  const showCarouselSection = chartCount > 0;
  type ChartItem =
    | { category: string; value: number; isMain: boolean }
    | { jobId: string; label: string; value: number; isMain: boolean };
  const getChartLabel = (item: ChartItem): string =>
    "category" in item ? item.category : item.label;
  const getChartId = (item: ChartItem): string => ("category" in item ? item.category : item.jobId);
  const isChartItemSelected = (item: ChartItem): boolean =>
    hasDomains
      ? "category" in item && item.category === activeCategory
      : "jobId" in item && item.jobId === activeJobId;
  const answerCount = session?.answers?.length ?? 0;
  const confidencePercent = Math.round((analysis?.confidence ?? 0) * 100);
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
        phone: contactPhone.trim() || undefined,
        jobId: analysis.jobId,
        explanation: analysis.explanation,
        scores: analysis.scores,
      });
      setShowContactForm(false);
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
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                RH&MOI <span className="font-normal text-muted-foreground">by</span> SUP des RH
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#008c54]/10 text-[#008c54] border border-[#008c54]/20 shrink-0">
                Résultats
              </span>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/sessions")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 bg-card"
            >
              Mes sessions
            </button>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-6 md:py-10 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Résultat principal — bannière hero colorée */}
          <div
            className="relative overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{
              background: "linear-gradient(135deg, #004080 0%, #005fac 40%, #007a3d 100%)",
            }}
          >
            {/* Déco bg */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/[0.05] blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/[0.04] blur-2xl" />
            </div>

            <div className="relative p-6 sm:p-8 text-center text-white">
              {/* Checkmark animé */}
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 border border-white/30 mb-5 shadow-lg">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>

              <p className="text-xs font-semibold text-white/60 uppercase tracking-[0.2em] mb-2">
                Ton résultat de quiz
              </p>

              {analysis?.job?.category ? (
                <>
                  <h1 className="text-2xl sm:text-3xl md:text-[2.2rem] font-heading font-extrabold text-white mb-2 leading-tight tracking-tight">
                    {analysis.job.category}
                  </h1>
                  <p className="text-sm text-white/75 mb-5">
                    Métier le plus proche :{" "}
                    <span className="font-bold text-white">{topJobLabel}</span>
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl md:text-[2.2rem] font-heading font-extrabold text-white mb-2">
                    {topJobLabel}
                  </h1>
                  <p className="text-sm text-white/75 mb-5">
                    Domaine : {selectedJob?.category ?? "Métier RH"}
                  </p>
                </>
              )}

              {/* Chips stats */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 border border-white/30 px-3.5 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {confidencePercent}% de correspondance
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-xs text-white/80">
                  {answerCount} réponse{answerCount > 1 ? "s" : ""}
                </span>
                {categoryJobs.length > 1 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-xs text-white/80">
                    {categoryJobs.length} fiches
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profil + Statistiques rapides */}
          {user && (
            <div
              className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
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
                      {chartCount}{" "}
                      {hasDomains
                        ? `domaine${chartCount > 1 ? "s" : ""} RH`
                        : `métier${chartCount > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Graphique : domaines RH ou métiers (fallback) */}
          {chartDataForDisplay.length > 0 && (
            <Card
              className="border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "100ms" }}
            >
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {hasDomains ? "Domaines RH — affinités" : "Comparaison des métiers"}
                    </p>
                    {hasDomains && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/15">
                        👆 Clique pour explorer
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {hasDomains
                      ? `${chartCount} domaine${chartCount > 1 ? "s" : ""} RH identifiés · Clique sur une barre pour afficher les fiches métiers du domaine`
                      : `${chartCount} métier${chartCount > 1 ? "s" : ""} analysés · Clique sur une barre pour voir la fiche`}
                  </p>
                  {hasDomains && activeCategory && (
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
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 sm:p-4 md:p-6"
                >
                  <div
                    className={`flex items-end gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 ${visibleChartData.length > 6 ? "overflow-x-auto pb-2" : "justify-center"} min-h-[180px] sm:min-h-[200px]`}
                  >
                    {(visibleChartData as ChartItem[]).map((item, idx) => {
                      const maxVal = chartDataForDisplay[0]?.value || 100;
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
                      const isSelected = isChartItemSelected(item);
                      const label = getChartLabel(item);
                      const id = getChartId(item);
                      const labelShort = label.length > 18 ? label.slice(0, 16) + "…" : label;
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => {
                            if (hasDomains) {
                              setSelectedCategory(
                                id === activeCategory && !selectedCategory ? null : id,
                              );
                            } else {
                              setSelectedJobId(id === activeJobId ? null : id);
                            }
                          }}
                          title={`Voir : ${label}`}
                          className="flex flex-col items-center gap-1.5 animate-in fade-in cursor-pointer group transition-transform duration-150 hover:scale-105 focus:outline-none"
                          style={{
                            animationDelay: `${idx * 50}ms`,
                            minWidth: visibleChartData.length > 6 ? "48px" : undefined,
                            flex: visibleChartData.length <= 6 ? "1 1 0" : undefined,
                            maxWidth: "min(120px, 22vw)",
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
                          <div className="w-full flex flex-col justify-end h-36 sm:h-40">
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
                            title={label}
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
                          : `Voir les ${chartDataForDisplay.length - 5} autres`}
                      </button>
                    </div>
                  )}
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Carrousel fiches métier liées au domaine sélectionné (ou top métiers si pas de domaines) */}
          {showCarouselSection && (
            <Card
              className="border border-[#008c54]/25 bg-card animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "140ms" }}
            >
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-[#008c54]/15 border border-[#008c54]/25 flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-[#008c54]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-heading font-semibold text-foreground">
                          {hasDomains
                            ? (activeCategory ?? "Fiches de ce domaine")
                            : "Fiches métier correspondantes"}
                        </h2>
                        {hasDomains && carouselJobs.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#008c54]/10 text-[#008c54] border border-[#008c54]/20 shrink-0">
                            {carouselJobs.length} fiche{carouselJobs.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        {hasDomains && categoryJobs.length === 0
                          ? "Aucune fiche métier dans ce domaine pour le moment."
                          : carouselJobs.length === 1
                            ? "Clique pour voir le détail"
                            : "Glisse pour explorer · Clique sur une fiche pour le détail"}
                      </p>
                    </div>
                  </div>
                  {hasDomains && selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs text-primary hover:underline shrink-0 self-start sm:self-center"
                    >
                      ← Retour au domaine principal
                    </button>
                  )}
                </div>
                {carouselJobs.length > 0 ? (
                  <div
                    className="flex gap-3 md:gap-4 overflow-x-auto pb-3 px-4 sm:px-5 md:px-6 hide-scrollbar"
                    style={{ scrollSnapType: "x mandatory" }}
                  >
                    {carouselJobs.map((j) => {
                      const isActive = j.id === activeJobId;
                      const isTop = j.id === analysis?.jobId;
                      return (
                        <div
                          key={j.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setFicheModalJob(j);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setFicheModalJob(j);
                            }
                          }}
                          className="shrink-0 text-left rounded-2xl border-2 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 active:scale-[0.98] flex flex-col"
                          style={{
                            width: carouselJobs.length === 1 ? "100%" : "clamp(230px, 32vw, 280px)",
                            scrollSnapAlign: "start",
                            borderColor: isTop ? "#004080" : isActive ? "#004080" : "var(--border)",
                            background: isTop
                              ? "rgba(0,64,128,0.06)"
                              : isActive
                                ? "rgba(0,64,128,0.04)"
                                : "var(--card)",
                            boxShadow: isTop ? "0 4px 20px rgba(0,64,128,0.12)" : undefined,
                            padding: "1rem",
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div
                              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                              style={{
                                background: isTop
                                  ? "#004080"
                                  : isActive
                                    ? "rgba(0,64,128,0.15)"
                                    : "rgba(0,64,128,0.08)",
                              }}
                            >
                              <Sparkles
                                className="h-4 w-4"
                                style={{ color: isTop ? "#fff" : "#004080" }}
                              />
                            </div>
                            {isTop && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#008c54] rounded-full px-2.5 py-1 shrink-0 shadow-sm">
                                ★ Recommandé
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {j.name}
                          </p>
                          {(j.salary || j.hiringRate != null) && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {j.salary && (
                                <span className="inline-flex items-center text-[10px] font-medium bg-muted/60 text-foreground/80 rounded-full px-2 py-0.5">
                                  💰 {j.salary}
                                </span>
                              )}
                              {j.hiringRate != null && (
                                <span className="inline-flex items-center text-[10px] font-medium bg-[#008c54]/10 text-[#008c54] rounded-full px-2 py-0.5">
                                  📊 {j.hiringRate}%
                                </span>
                              )}
                            </div>
                          )}
                          {j.description && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                              {j.description}
                            </p>
                          )}
                          <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold text-primary group-hover:underline">
                              Voir la fiche →
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 px-4 text-center">
                    <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Aucune fiche métier dans ce domaine pour le moment.
                    </p>
                  </div>
                )}
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
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Description du métier
                    </p>
                    <div className="max-h-64 overflow-y-auto pr-2 rounded-lg border border-border/50 bg-muted/20 p-3">
                      <FormatDescription text={fiche.description} />
                    </div>
                  </div>
                )}
                {(fiche?.salary ?? fiche?.hiringRate ?? fiche?.turnoverRate) && (
                  <>
                    <Separator className="bg-border" />
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      onClick={() => setFicheModalJob(fiche)}
                    >
                      Voir la fiche complète
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CTA Contact */}
          <div
            className="relative overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 border border-[#f37021]/20"
            style={{
              animationDelay: "200ms",
              background: "linear-gradient(135deg, #fff7f0 0%, #fff 60%, #f0f9ff 100%)",
            }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#f37021]/[0.06] blur-2xl" />
            </div>
            <div className="relative p-5 md:p-8 text-center dark:bg-card dark:border-[#f37021]/15">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f37021]/15 border border-[#f37021]/25 mb-4">
                <Briefcase className="h-6 w-6 text-[#f37021]" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">
                Intéressé par ce métier ?
              </h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                L&apos;équipe SUP des RH peut t&apos;aider à trouver une alternance ou un stage dans
                ce domaine.
              </p>
              {showContactForm ? (
                <div className="max-w-sm mx-auto space-y-3 animate-in fade-in duration-300">
                  <input
                    type="tel"
                    placeholder="Ton numéro de téléphone (optionnel)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowContactForm(false)}
                      className="h-10 px-5 text-sm"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleContact}
                      disabled={contactLoading}
                      className="h-10 px-8 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {contactLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Envoi…
                        </>
                      ) : (
                        "Envoyer ma demande"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowContactForm(true)}
                  className="h-11 px-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  Être contacté par SUP des RH
                </Button>
              )}
            </div>
          </div>

          {/* Actions secondaires */}
          <div
            className="flex flex-wrap gap-3 justify-center pb-6 animate-in fade-in duration-500"
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
            className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-border/60 shrink-0 bg-muted/40">
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {ficheModalJob.description && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Description
                  </p>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-3.5 py-3 max-h-64 overflow-y-auto">
                    <FormatDescription text={ficheModalJob.description} />
                  </div>
                </div>
              )}
              {(ficheModalJob.salary ||
                ficheModalJob.hiringRate != null ||
                ficheModalJob.turnoverRate != null) && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Indicateurs
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {ficheModalJob.salary && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[11px] text-foreground">
                        💰 {ficheModalJob.salary}
                      </div>
                    )}
                    {ficheModalJob.hiringRate != null && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11px]">
                        📊 Taux d&apos;embauche&nbsp;: {ficheModalJob.hiringRate}%
                      </div>
                    )}
                    {ficheModalJob.turnoverRate != null && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 text-muted-foreground px-3 py-1 text-[11px]">
                        🔁 Turnover&nbsp;: {ficheModalJob.turnoverRate}%
                      </div>
                    )}
                  </div>
                </div>
              )}
              {Array.isArray(ficheModalJob.indicators) && ficheModalJob.indicators.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Autres indicateurs
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ficheModalJob.indicators.map((ind: JobFicheIndicator, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-muted/20 px-3 py-2.5"
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
