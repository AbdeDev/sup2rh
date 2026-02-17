import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import {
  createQuizSession,
  getQuizSession,
  submitAnswer,
  analyzeQuiz,
  type QuizSessionWithAnswers,
  type AnalysisResult,
} from "../lib/api";
import { Button } from "../../../web/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../web/src/components/ui/card";

export function QuizPage() {
  const [email, setEmail] = useState<string>("");
  const [session, setSession] = useState<QuizSessionWithAnswers | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  async function createSession() {
    setLoading(true);
    setError(null);
    try {
      const newSession = await createQuizSession();
      const fullSession = await getQuizSession(newSession.id);
      setSession(fullSession);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création de la session");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAnswer(questionId: string, answerId: string) {
    if (!session) return;

    setLoading(true);
    setError(null);
    try {
      await submitAnswer(session.id, {
        questionId,
        answerId,
      });
      // Rafraîchir la session
      const updatedSession = await getQuizSession(session.id);
      setSession(updatedSession);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la soumission de la réponse");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!session) return;

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeQuiz(session.id);
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Sup2RH</CardTitle>
            <CardDescription>Connecté ✅ {email ? `(${email})` : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {!session && (
              <Button onClick={createSession} disabled={loading}>
                {loading ? "Création..." : "Créer une nouvelle session de quiz"}
              </Button>
            )}

            {session && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <strong>Session ID:</strong> {session.id}
                  <br />
                  <strong>Réponses:</strong> {session.answers.length}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Réponses soumises:</h3>
                  {session.answers.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune réponse pour le moment</p>
                  ) : (
                    <ul className="space-y-1">
                      {session.answers.map((answer) => (
                        <li key={answer.id} className="text-sm">
                          <strong>Q{answer.questionId}:</strong>{" "}
                          {answer.answerId || answer.textValue || "N/A"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSubmitAnswer("q1", "a1")}
                    disabled={loading}
                    variant="outline"
                  >
                    Ajouter réponse test (Q1 → A1)
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || session.answers.length === 0}
                  >
                    {loading ? "Analyse..." : "Analyser avec IA"}
                  </Button>
                </div>
              </div>
            )}

            {analysis && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Résultat de l'analyse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <strong>Métier recommandé:</strong> {analysis.jobId}
                    </p>
                    <p>
                      <strong>Confiance:</strong> {(analysis.confidence * 100).toFixed(1)}%
                    </p>
                    <p>
                      <strong>Explication:</strong> {analysis.explanation}
                    </p>
                    {Object.keys(analysis.scores).length > 0 && (
                      <div>
                        <strong>Scores:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {Object.entries(analysis.scores).map(([job, score]) => (
                            <li key={job}>
                              {job}: {(score * 100).toFixed(1)}%
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" onClick={logout} className="w-full">
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
