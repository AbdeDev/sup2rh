import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  Trophy,
  ArrowRight,
  User,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  createQuizSession,
  getQuizSession,
  getQuizSessions,
  submitAnswer,
  analyzeQuiz,
  type QuizSessionWithAnswers,
  type QuizSession,
  type AnalysisResult,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "../components/ui/sidebar";

export function QuizPage() {
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [currentSession, setCurrentSession] = useState<QuizSessionWithAnswers | null>(null);
  const [previousSessions, setPreviousSessions] = useState<QuizSession[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState("");
  const [answerId, setAnswerId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    loadPreviousSessions();
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

  async function loadPreviousSessions() {
    setLoadingSessions(true);
    try {
      const { items } = await getQuizSessions();
      setPreviousSessions(items);
    } catch (e) {
      console.error("Erreur lors du chargement des sessions:", e);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function createSession() {
    setLoading(true);
    setError(null);
    try {
      const newSession = await createQuizSession();
      const fullSession = await getQuizSession(newSession.id);
      setCurrentSession(fullSession);
      setAnalysis(null);
      await loadPreviousSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  async function loadSession(sessionId: string) {
    setLoading(true);
    setError(null);
    try {
      const session = await getQuizSession(sessionId);
      setCurrentSession(session);
      setAnalysis(null);
      if (session.finalJobId) {
        try {
          const result = await analyzeQuiz(sessionId);
          setAnalysis(result);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!currentSession || !questionId || !answerId) {
      setError("Renseigne question et réponse");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitAnswer(currentSession.id, { questionId, answerId });
      const updatedSession = await getQuizSession(currentSession.id);
      setCurrentSession(updatedSession);
      setQuestionId("");
      setAnswerId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!currentSession) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeQuiz(currentSession.id);
      setAnalysis(result);
      await loadPreviousSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function goToResults() {
    if (analysis && currentSession) {
      navigate(`/result/${currentSession.id}`, { state: { analysis, session: currentSession } });
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    navigate("/login");
  }

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  const jobLabel = (id: string) => id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-11 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-3 md:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Separator orientation="vertical" className="h-3.5 mx-0.5 lg:hidden" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">SupdesRH</span>
          </div>
          <div className="ml-auto">
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

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:static inset-y-0 left-0 z-40 w-52 border-r border-border bg-card flex flex-col transition-transform duration-200 ease-out lg:translate-x-0`}
        >
          <Sidebar className="border-0 bg-transparent h-full">
            <SidebarHeader className="border-b border-border px-3 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">Sessions</span>
            </SidebarHeader>
            <SidebarContent className="p-2 overflow-auto">
              {loadingSessions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : previousSessions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
                  Aucune session
                </p>
              ) : (
                <div className="space-y-0.5">
                  {previousSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors ${
                        currentSession?.id === session.id
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {session.finalJobId ? (
                          <Trophy className="h-3 w-3 shrink-0 opacity-80" />
                        ) : (
                          <Clock className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate">
                          {session.finalJobId ? jobLabel(session.finalJobId) : "En cours"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 pl-4">
                        {session.answerCount ?? 0} réponses · {formatDate(session.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </SidebarContent>
            <SidebarFooter className="border-t border-border p-2">
              <Button
                onClick={() => navigate("/quiz/start")}
                className="w-full h-8 text-xs font-normal bg-muted/80 hover:bg-accent text-foreground border border-border/80"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Nouveau quiz
              </Button>
            </SidebarFooter>
          </Sidebar>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-5 max-w-xl mx-auto">
            {error && (
              <div className="mb-3 px-2.5 py-2 rounded border border-border bg-card text-destructive text-[11px]">
                {error}
              </div>
            )}

            {/* Aucune session : CTA simple */}
            {!currentSession && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
                  Réponds à quelques questions pour découvrir ton métier RH idéal. L’IA te
                  recommandera un profil.
                </p>
                <Button
                  onClick={() => navigate("/quiz/start")}
                  className="h-8 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Commencer un quiz
                </Button>
              </div>
            )}

            {/* Session en cours : formulaire + réponses + analyser */}
            {currentSession && !analysis && (
              <div className="space-y-4">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCurrentSession(null);
                      setAnalysis(null);
                    }}
                  >
                    Nouveau quiz
                  </button>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label htmlFor="questionId" className="text-[10px] text-muted-foreground">
                        Question
                      </Label>
                      <Input
                        id="questionId"
                        placeholder="ex: q1"
                        value={questionId}
                        onChange={(e) => setQuestionId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                        className="h-7 text-xs border-border bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="answerId" className="text-[10px] text-muted-foreground">
                        Réponse
                      </Label>
                      <Input
                        id="answerId"
                        placeholder="ex: a1"
                        value={answerId}
                        onChange={(e) => setAnswerId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                        className="h-7 text-xs border-border bg-background"
                      />
                    </div>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={loading || !questionId || !answerId}
                      className="h-7 px-2.5 text-[11px] bg-muted hover:bg-accent text-foreground border border-border/80"
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card divide-y divide-border">
                  {currentSession.answers.length === 0 ? (
                    <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                      Aucune réponse. Ajoute des réponses ci-dessus.
                    </div>
                  ) : (
                    currentSession.answers.map((answer, index) => (
                      <div
                        key={answer.id}
                        className="flex items-center justify-between px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground w-4">{index + 1}.</span>
                          <span className="text-foreground truncate">{answer.questionId}</span>
                          <span className="text-muted-foreground truncate">
                            → {answer.answerId || answer.textValue || "—"}
                          </span>
                        </div>
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      </div>
                    ))
                  )}
                </div>

                {currentSession.answers.length > 0 && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full h-8 text-xs bg-orange text-white hover:bg-orange/90 border-0"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Analyser
                  </Button>
                )}
              </div>
            )}

            {/* Résultat */}
            {analysis && currentSession && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4 text-center space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{jobLabel(analysis.jobId)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(analysis.confidence * 100).toFixed(0)}% de confiance
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {analysis.explanation}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={goToResults}
                    className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Détails
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-xs border-border text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCurrentSession(null);
                      setAnalysis(null);
                    }}
                  >
                    Nouveau quiz
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
