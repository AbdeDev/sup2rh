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
import { AppLogo } from "../components/AppLogo";

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
          /* ignore */
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
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden text-muted-foreground hover:text-foreground rounded-xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Separator orientation="vertical" className="h-4 lg:hidden" />
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
              <p className="text-[10px] text-muted-foreground leading-tight">Quiz</p>
            </div>
          </button>
          <div className="ml-auto">
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
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Mon profil
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
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
          } fixed lg:static inset-y-0 left-0 z-40 w-56 border-r border-border bg-card flex flex-col transition-transform duration-200 ease-out lg:translate-x-0`}
        >
          <Sidebar className="border-0 bg-transparent h-full">
            <SidebarHeader className="border-b border-border px-3.5 py-3">
              <span className="text-xs font-heading font-bold text-foreground uppercase tracking-wider">
                Sessions
              </span>
            </SidebarHeader>
            <SidebarContent className="p-2.5 overflow-auto">
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
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                        currentSession?.id === session.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {session.finalJobId ? (
                          <Trophy className="h-3 w-3 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate font-medium">
                          {session.finalJobId ? jobLabel(session.finalJobId) : "En cours"}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 pl-5 ${currentSession?.id === session.id ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}
                      >
                        {session.answerCount ?? 0} rép. &middot; {formatDate(session.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </SidebarContent>
            <SidebarFooter className="border-t border-border p-2.5">
              <Button
                onClick={() => navigate("/quiz/start")}
                className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Nouveau quiz
              </Button>
            </SidebarFooter>
          </Sidebar>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-xl mx-auto">
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs">
                {error}
              </div>
            )}

            {!currentSession && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-heading font-bold text-foreground mb-2">
                  Prêt à découvrir ton profil ?
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Réponds à quelques questions pour découvrir ton métier RH idéal.
                </p>
                <Button
                  onClick={() => navigate("/quiz/start")}
                  className="h-10 px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Commencer un quiz
                </Button>
              </div>
            )}

            {currentSession && !analysis && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {currentSession.answers.length} réponses
                  </span>
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      setCurrentSession(null);
                      setAnalysis(null);
                    }}
                  >
                    Nouveau quiz
                  </button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label
                        htmlFor="questionId"
                        className="text-[10px] text-muted-foreground font-medium"
                      >
                        Question
                      </Label>
                      <Input
                        id="questionId"
                        placeholder="ex: q1"
                        value={questionId}
                        onChange={(e) => setQuestionId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                        className="h-8 text-xs border-border bg-background rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="answerId"
                        className="text-[10px] text-muted-foreground font-medium"
                      >
                        Réponse
                      </Label>
                      <Input
                        id="answerId"
                        placeholder="ex: a1"
                        value={answerId}
                        onChange={(e) => setAnswerId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                        className="h-8 text-xs border-border bg-background rounded-lg"
                      />
                    </div>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={loading || !questionId || !answerId}
                      className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {currentSession.answers.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                      Aucune réponse encore.
                    </div>
                  ) : (
                    currentSession.answers.map((answer, index) => (
                      <div
                        key={answer.id}
                        className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-muted-foreground w-4 text-right">{index + 1}.</span>
                          <span className="text-foreground font-medium truncate">
                            {answer.questionId}
                          </span>
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
                    className="w-full h-10 text-sm font-semibold rounded-xl"
                    style={{ background: "#f37021", color: "#fff" }}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1.5" />
                    )}
                    Analyser mes réponses
                  </Button>
                )}
              </div>
            )}

            {analysis && currentSession && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-lg font-heading font-bold text-foreground">
                    {jobLabel(analysis.jobId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(analysis.confidence * 100).toFixed(0)}% de correspondance
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {analysis.explanation}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={goToResults}
                    className="flex-1 h-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold"
                  >
                    Voir les détails
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 text-sm border-border rounded-xl"
                    onClick={() => {
                      setCurrentSession(null);
                      setAnalysis(null);
                    }}
                  >
                    Nouveau
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
