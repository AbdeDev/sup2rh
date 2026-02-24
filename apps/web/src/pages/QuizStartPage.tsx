import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";

import {
  createQuizSession,
  getQuizSession,
  getQuizQuestions,
  submitAnswer,
  analyzeQuiz,
  type QuizSessionWithAnswers,
  type QuizQuestion,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import { ThemeToggle } from "../components/ThemeToggle";
import { AppLogo } from "../components/AppLogo";

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  { id: "q1", text: "J'aime travailler en équipe" },
  { id: "q2", text: "Je suis organisé et méthodique" },
  { id: "q3", text: "Je préfère les tâches administratives" },
  { id: "q4", text: "J'aime aider les autres à progresser" },
  { id: "q5", text: "Je suis à l'aise avec les chiffres" },
  { id: "q6", text: "Je préfère le contact client" },
  { id: "q7", text: "Je suis créatif" },
  { id: "q8", text: "J'aime résoudre des problèmes complexes" },
  { id: "q9", text: "Je préfère suivre des procédures établies" },
  { id: "q10", text: "J'aime former et transmettre" },
  { id: "q11", text: "Je suis à l'aise avec la négociation" },
  { id: "q12", text: "Je préfère travailler en autonomie" },
  { id: "q13", text: "J'aime analyser des données" },
  { id: "q14", text: "Je suis empathique" },
  { id: "q15", text: "Je préfère les environnements structurés" },
];

const MASCOTT_LOGOS = [
  "/logo-1.png",
  "/logo-2.png",
  "/logo-3.png",
  "/logo-4.png",
  "/logo-5.png",
  "/logo-6.png",
  "/logo-7.png",
  "/logo-8.png",
];

function useRandomLogoIndices(questionIds: string[]) {
  const idsKey = questionIds.join(",");
  return useMemo(() => {
    const map: Record<string, number> = {};
    questionIds.forEach((id) => {
      map[id] = Math.floor(Math.random() * MASCOTT_LOGOS.length);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);
}

export function QuizStartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");
  const [session, setSession] = useState<QuizSessionWithAnswers | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>(FALLBACK_QUESTIONS);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionsPerPage, setQuestionsPerPage] = useState(5);

  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const logoIndices = useRandomLogoIndices(questionIds);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (!sessionIdParam || questions.length === 0) return;
    setLoading(true);
    getQuizSession(sessionIdParam)
      .then((s) => {
        if (s.finalJobId) {
          navigate(`/result/${s.id}`);
          return;
        }
        setSession(s);
        const restored: Record<string, number> = {};
        const labels: Record<string, number> = { a1: 1, a2: 2, a3: 3, a4: 4, a5: 5 };
        s.answers.forEach((a) => {
          const val = a.answerId ? labels[a.answerId] : 3;
          if (val) restored[a.questionId] = val;
        });
        setAnswers((prev) => ({ ...prev, ...restored }));
        const answeredCount = s.answers.length;
        const nextPage = Math.min(
          Math.ceil(answeredCount / questionsPerPage),
          Math.ceil(questions.length / questionsPerPage) - 1,
        );
        setCurrentPage(Math.max(0, nextPage));
      })
      .catch(() => setError("Session introuvable"))
      .finally(() => setLoading(false));
  }, [sessionIdParam, questions.length, questionsPerPage, navigate]);

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const questionsRes = await getQuizQuestions().catch(() => ({
        questions: FALLBACK_QUESTIONS,
        questionsPerPage: 5,
      }));
      const loadedQuestions =
        questionsRes.questions?.length > 0
          ? questionsRes.questions.map((q) => ({
              id: q.id,
              text: q.text,
              answers: q.answers,
              jobId: q.jobId ?? null,
            }))
          : FALLBACK_QUESTIONS;
      setQuestions(loadedQuestions);
      setQuestionsPerPage(
        questionsRes.questionsPerPage ?? Math.max(1, Math.ceil(loadedQuestions.length / 3)),
      );
      const initialAnswers: Record<string, number> = {};
      loadedQuestions.forEach((q) => {
        initialAnswers[q.id] = 3;
      });
      setAnswers(initialAnswers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function handleSliderChange(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleNext() {
    const currentQuestions = questions.slice(
      currentPage * questionsPerPage,
      (currentPage + 1) * questionsPerPage,
    );
    setLoading(true);
    setError(null);
    try {
      let sessionToUse = session;
      if (!sessionToUse) {
        const newSession = await createQuizSession();
        const fullSession = await getQuizSession(newSession.id);
        setSession(fullSession);
        sessionToUse = fullSession;
      }
      for (const q of currentQuestions) {
        const answerValue = answers[q.id];
        const answerId = `a${answerValue}`;
        await submitAnswer(sessionToUse!.id, {
          questionId: q.id,
          answerId,
          jobId: q.jobId ?? undefined,
          questionText: q.text ?? undefined,
        });
      }
      const updatedSession = await getQuizSession(sessionToUse!.id);
      setSession(updatedSession);
      if (currentPage === Math.ceil(questions.length / questionsPerPage) - 1) {
        const result = await analyzeQuiz(sessionToUse!.id);
        navigate(`/result/${sessionToUse!.id}`, {
          state: { analysis: result, session: updatedSession },
        });
      } else {
        setCurrentPage((p) => p + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function handlePrevious() {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  }

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement du quiz…</p>
      </div>
    );
  }

  if (questions.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-4">
        <p className="text-sm text-muted-foreground text-center">
          {error || "Impossible de démarrer le quiz."}
        </p>
        <Button
          variant="outline"
          className="h-10 text-sm rounded-xl"
          onClick={() => navigate("/quiz")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au quiz
        </Button>
      </div>
    );
  }

  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIdx = currentPage * questionsPerPage;
  const endIdx = startIdx + questionsPerPage;
  const currentQuestions = questions.slice(startIdx, endIdx);
  const isLastPage = currentPage === totalPages - 1;
  const canProceed = currentQuestions.every((q) => answers[q.id] !== undefined);
  const progress = ((currentPage + 1) / totalPages) * 100;

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
            <AppLogo className="h-9 w-9 shrink-0 object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                SupdesRH
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Quiz d'orientation</p>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {currentPage + 1}/{totalPages}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-[#008c54] transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          key={currentPage}
          className="max-w-2xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Questions {startIdx + 1}–{Math.min(endIdx, questions.length)}
              </span>
              <span className="text-xs text-muted-foreground">sur {questions.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentPage
                      ? "w-8 bg-primary"
                      : i < currentPage
                        ? "w-2 bg-success"
                        : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-8">
            {currentQuestions.map((question, idx) => (
              <Card
                key={question.id}
                className="border border-border bg-card rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {startIdx + idx + 1}
                      </div>
                      <p className="text-sm text-foreground font-medium pt-0.5 leading-relaxed">
                        {question.text}
                      </p>
                    </div>
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                      <img
                        src={MASCOTT_LOGOS[logoIndices[question.id] ?? 0]}
                        alt=""
                        className="h-10 w-10 object-contain logo-theme-safe"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <Slider
                    value={answers[question.id] ?? 3}
                    onChange={(value) => handleSliderChange(question.id, value)}
                    min={1}
                    max={5}
                    disabled={loading}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentPage === 0 || loading}
                className="h-10 text-xs border-border rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Précédent
              </Button>
              {session && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/sessions")}
                  disabled={loading}
                  className="h-10 text-xs text-muted-foreground"
                >
                  Quitter
                </Button>
              )}
            </div>
            <Button
              onClick={handleNext}
              disabled={!canProceed || loading}
              className="h-10 px-6 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <>
                  {isLastPage ? "Terminer le quiz" : "Suivant"}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
