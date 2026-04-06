import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

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
import { Slider } from "../components/ui/slider";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
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

const SCORE_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Pas du tout", color: "#ef4444", bg: "bg-red-50 dark:bg-red-950/30" },
  2: { label: "Plutôt non", color: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/30" },
  3: { label: "Neutre", color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800/40" },
  4: { label: "Plutôt oui", color: "#22c55e", bg: "bg-green-50 dark:bg-green-950/30" },
  5: { label: "Tout à fait", color: "#008c54", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
};

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
        await submitAnswer(sessionToUse!.id, {
          questionId: q.id,
          answerId: `a${answers[q.id]}`,
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

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement du quiz…</p>
      </div>
    );
  }

  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIdx = currentPage * questionsPerPage;
  const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
  const currentQuestions = questions.slice(startIdx, endIdx);
  const isLastPage = currentPage === totalPages - 1;
  const canProceed = currentQuestions.every((q) => answers[q.id] !== undefined);
  const progress = ((currentPage + 1) / totalPages) * 100;
  const answeredTotal = Object.keys(answers).filter((k) =>
    questions.some((q) => q.id === k),
  ).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            <AppLogo className="h-8 w-8 shrink-0 object-contain" />
            <span className="hidden sm:block text-sm font-heading font-bold text-foreground">
              Quiz RH&MOI <span className="font-normal text-muted-foreground">by</span> SUP des RH
            </span>
          </button>

          {/* Step dots */}
          <div className="flex-1 flex justify-center px-4">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i < currentPage
                      ? "h-2 w-2 bg-[#008c54]"
                      : i === currentPage
                        ? "h-2 w-6 bg-primary"
                        : "h-2 w-2 bg-muted-foreground/25"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentPage + 1}/{totalPages}
            </span>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted shrink-0">
        <div
          className="h-full bg-gradient-to-r from-[#004080] to-[#008c54] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          key={currentPage}
          className="max-w-xl mx-auto px-4 py-6 md:py-10 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {startIdx + 1}–{endIdx}
                <span className="font-normal text-muted-foreground"> sur {questions.length}</span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {answeredTotal}/{questions.length} répondues
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Question cards */}
          <div className="space-y-3 mb-8">
            {currentQuestions.map((question, idx) => {
              const score = answers[question.id] ?? 3;
              const cfg = SCORE_CONFIG[score];
              return (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={startIdx + idx + 1}
                  score={score}
                  cfg={cfg}
                  delay={idx * 60}
                  loading={loading}
                  onChange={(v) => setAnswers((p) => ({ ...p, [question.id]: v }))}
                />
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 0 || loading}
              className="h-11 px-5 text-sm rounded-xl gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>

            {session && (
              <Button
                variant="ghost"
                onClick={() => navigate("/sessions")}
                disabled={loading}
                className="h-11 text-xs text-muted-foreground hidden sm:flex"
              >
                Quitter
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed || loading}
              className="h-11 px-6 text-sm rounded-xl font-semibold gap-2 flex-1 sm:flex-none"
              style={{ backgroundColor: canProceed ? "#004080" : "#6b7280", color: "#ffffff" }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLastPage ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Voir mon résultat
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  score: number;
  cfg: { label: string; color: string; bg: string };
  delay: number;
  loading: boolean;
  onChange: (v: number) => void;
}

function QuestionCard({
  question,
  index,
  score,
  cfg,
  delay,
  loading,
  onChange,
}: QuestionCardProps) {
  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Colored top accent */}
      <div className="h-0.5 transition-all duration-300" style={{ backgroundColor: cfg.color }} />

      <div className="p-4 sm:p-5">
        {/* Question text */}
        <div className="flex items-start gap-3 mb-4">
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white mt-0.5"
            style={{ backgroundColor: cfg.color }}
          >
            {index}
          </span>
          <p className="text-sm font-medium text-foreground leading-relaxed">{question.text}</p>
        </div>

        {/* Slider : glisser de Pas d'accord à D'accord */}
        <div className="space-y-2">
          <Slider value={score} onChange={onChange} min={1} max={5} step={1} disabled={loading} />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Pas d&apos;accord</span>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
            >
              {cfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground">D&apos;accord</span>
          </div>
        </div>

        {/* Boutons rapides 1–5 (optionnel, pour mobile) */}
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              disabled={loading}
              onClick={() => onChange(v)}
              className={`flex-1 h-7 rounded-lg text-[10px] font-semibold transition-all ${
                score === v ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              style={score === v ? { backgroundColor: SCORE_CONFIG[v].color } : {}}
              title={SCORE_CONFIG[v].label}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
