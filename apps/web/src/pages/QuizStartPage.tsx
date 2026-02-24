import { useEffect, useState } from "react";
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

// Questions par défaut si aucun quiz en BDD
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

  useEffect(() => {
    loadQuestions();
  }, []);

  /** Reprend une session en cours : charge la session et restaure les réponses. */
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

  /** Charge les questions sans créer de session. La session n'est créée qu'au premier clic sur Suivant. */
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
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  }

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (questions.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {error || "Impossible de démarrer le quiz."}
        </p>
        <Button
          variant="outline"
          className="h-9 text-sm border-border"
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-11 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-3 md:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">SupdesRH</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Question {startIdx + 1}-{Math.min(endIdx, questions.length)} sur {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i === currentPage ? "bg-primary" : i < currentPage ? "bg-success" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md border border-border bg-card text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Questions */}
          <div className="space-y-4 mb-6">
            {currentQuestions.map((question, idx) => (
              <Card key={question.id} className="border border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-foreground font-medium">
                    {startIdx + idx + 1}. {question.text}
                  </p>
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

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentPage === 0 || loading}
                className="h-9 text-xs border-border text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Précédent
              </Button>
              {session && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/sessions")}
                  disabled={loading}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  Quitter
                </Button>
              )}
            </div>
            <Button
              onClick={handleNext}
              disabled={!canProceed || loading}
              className="h-9 px-6 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <>
                  {isLastPage ? "Terminer" : "Suivant"}
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
