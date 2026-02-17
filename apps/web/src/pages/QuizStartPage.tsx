import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";

import {
  createQuizSession,
  getQuizSession,
  submitAnswer,
  analyzeQuiz,
  type QuizSessionWithAnswers,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Slider } from "../components/ui/slider";

// Questions exemple - à remplacer par les vraies questions depuis l'API
const QUESTIONS = [
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

const QUESTIONS_PER_PAGE = 5;

export function QuizStartPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<QuizSessionWithAnswers | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startQuiz();
  }, []);

  async function startQuiz() {
    setLoading(true);
    setError(null);
    try {
      const newSession = await createQuizSession();
      const fullSession = await getQuizSession(newSession.id);
      setSession(fullSession);
      // Initialiser les réponses à 3 (neutre)
      const initialAnswers: Record<string, number> = {};
      QUESTIONS.forEach((q) => {
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
    if (!session) return;

    const currentQuestions = QUESTIONS.slice(
      currentPage * QUESTIONS_PER_PAGE,
      (currentPage + 1) * QUESTIONS_PER_PAGE,
    );

    setLoading(true);
    setError(null);

    try {
      // Sauvegarder les réponses de la page actuelle
      for (const q of currentQuestions) {
        const answerValue = answers[q.id];
        // Convertir slider (1-5) en answerId (a1 = pas d'accord, a5 = d'accord)
        const answerId = `a${answerValue}`;
        await submitAnswer(session.id, {
          questionId: q.id,
          answerId,
        });
      }

      // Charger la session mise à jour
      const updatedSession = await getQuizSession(session.id);
      setSession(updatedSession);

      // Si dernière page, analyser
      if (currentPage === Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE) - 1) {
        const result = await analyzeQuiz(session.id);
        navigate(`/result/${session.id}`, { state: { analysis: result, session: updatedSession } });
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

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalPages = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE);
  const startIdx = currentPage * QUESTIONS_PER_PAGE;
  const endIdx = startIdx + QUESTIONS_PER_PAGE;
  const currentQuestions = QUESTIONS.slice(startIdx, endIdx);
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
            <span className="text-xs font-medium text-foreground truncate">Sup2RH</span>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Question {startIdx + 1}-{Math.min(endIdx, QUESTIONS.length)} sur {QUESTIONS.length}
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
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentPage === 0 || loading}
              className="h-9 text-xs border-border text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Précédent
            </Button>
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
