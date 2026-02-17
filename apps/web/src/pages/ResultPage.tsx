import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, User, Mail, Sparkles, CheckCircle2 } from "lucide-react";

import {
  getQuizSession,
  analyzeQuiz,
  type AnalysisResult,
  type QuizSessionWithAnswers,
  getMe,
} from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(location.state?.analysis || null);
  const [session, setSession] = useState<QuizSessionWithAnswers | null>(
    location.state?.session || null,
  );
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (id && !session) {
      setLoading(true);
      getQuizSession(id)
        .then((s) => {
          setSession(s);
          if (!analysis && s.finalJobId) {
            return analyzeQuiz(id);
          }
          return null;
        })
        .then((result) => {
          if (result) setAnalysis(result);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, session, analysis]);

  useEffect(() => {
    getMe()
      .then((userData) => setUser({ email: userData.email }))
      .catch(console.error);
  }, []);

  async function handleContact() {
    setContactLoading(true);
    // TODO: Implémenter l'appel API pour contacter Sup2RH
    setTimeout(() => {
      setContactLoading(false);
      // Pour l'instant, on affiche juste un message
      alert("Demande de contact envoyée ! L'équipe Sup2RH te contactera bientôt.");
    }, 1000);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-in fade-in duration-300">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!analysis || !session) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 animate-in fade-in duration-300">
          <p className="text-sm text-muted-foreground">Résultats indisponibles</p>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-sm border-border text-foreground hover:bg-accent transition-all duration-200"
            onClick={() => navigate("/quiz")}
          >
            Retour au quiz
          </Button>
        </div>
      </div>
    );
  }

  const jobLabel = (id: string) => id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const topJobLabel = jobLabel(analysis.jobId);
  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1.5 h-8 w-8 transition-all duration-200 hover:bg-accent"
            onClick={() => navigate("/quiz")}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-200" />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <span className="text-xs text-muted-foreground">Résultat</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Colonne gauche : Profil utilisateur */}
          <div className="lg:w-80 shrink-0 border-r border-border bg-card/50 p-4 md:p-6 flex flex-col">
            <div className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Ton profil</h2>
              </div>
              {user && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <Separator className="bg-border" />
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Quiz complété
                    </p>
                    <p className="text-xs text-foreground">
                      {session.answers.length} réponse{session.answers.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite : Fiche métier + CTA */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 h-full flex flex-col">
              {/* Résultat principal */}
              <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-6">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-success/20 border border-success/30 mb-4 transition-transform duration-200 hover:scale-105">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-heading font-semibold text-foreground mb-2">
                    {topJobLabel}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {confidencePercent}% de correspondance avec ton profil
                  </p>
                </div>
              </div>

              {/* Fiche métier */}
              <Card
                className="border border-border bg-card mb-6 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: "100ms" }}
              >
                <CardContent className="p-5 md:p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Fiche métier RH</h2>
                  </div>
                  <Separator className="bg-border mb-4" />
                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                        Description
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {analysis.explanation}
                      </p>
                    </div>
                    <Separator className="bg-border" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                        Pourquoi ce métier te correspond
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Basé sur tes {session.answers.length} réponses au quiz, l&apos;IA a
                        identifié que le métier de{" "}
                        <span className="font-medium text-foreground">{topJobLabel}</span>{" "}
                        correspond le mieux à ton profil. Tes réponses montrent un intérêt et des
                        compétences alignées avec ce rôle dans le domaine des ressources humaines.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Contact */}
              <div
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: "200ms" }}
              >
                <Card className="border border-primary/30 bg-primary/5">
                  <CardContent className="p-5 md:p-6 text-center">
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      Intéressé par ce métier ?
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                      L&apos;équipe Sup2RH peut t&apos;aider à trouver une alternance ou un stage
                      dans ce domaine.
                    </p>
                    <Button
                      onClick={handleContact}
                      disabled={contactLoading}
                      className="h-10 px-8 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                    >
                      {contactLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Envoi…
                        </>
                      ) : (
                        "Être contacté par Sup2RH"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Actions secondaires */}
              <div
                className="mt-4 flex gap-3 justify-center animate-in fade-in duration-500"
                style={{ animationDelay: "300ms" }}
              >
                <Button
                  variant="outline"
                  className="h-9 text-xs border-border text-muted-foreground hover:text-foreground transition-all duration-200"
                  onClick={() => navigate("/quiz/start")}
                >
                  Nouveau quiz
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-xs border-border text-muted-foreground hover:text-foreground transition-all duration-200"
                  onClick={() => navigate("/sessions")}
                >
                  Mes sessions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
