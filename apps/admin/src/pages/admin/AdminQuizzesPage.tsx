import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, FileQuestion, Briefcase } from "lucide-react";

import { getQuizzes, deleteQuiz, getJobs, type QuizDefinition, type Job } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { AdminDashboard } from "./AdminDashboard";
import { AdminQuizForm } from "./AdminQuizForm";

export function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizDefinition[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizDefinition | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [quizzesRes, jobsRes] = await Promise.all([getQuizzes(), getJobs()]);
      setQuizzes(quizzesRes.items);
      setJobs(jobsRes.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Es-tu sûr de vouloir supprimer ce quiz ?")) return;
    try {
      await deleteQuiz(id);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
  }

  function handleEdit(quiz: QuizDefinition) {
    setEditingQuiz(quiz);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingQuiz(null);
    loadData();
  }

  function getJobName(jobId: string) {
    return jobs.find((j) => j.id === jobId)?.name || jobId;
  }

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-1">
              Quiz
            </h1>
            <p className="text-xs text-muted-foreground">
              Gère les parcours de quiz liés aux métiers RH
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau quiz
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

        {showForm && (
          <AdminQuizForm quiz={editingQuiz || undefined} jobs={jobs} onClose={handleFormClose} />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 animate-in fade-in duration-300">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8 text-center">
              <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Aucun quiz</p>
              <Button
                onClick={() => setShowForm(true)}
                className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz, index) => (
              <Card
                key={quiz.id}
                className="border border-border bg-card hover:border-primary/50 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors duration-200">
                        {quiz.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span>{getJobName(quiz.jobId)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground">
                      {quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1 border-border text-muted-foreground hover:text-foreground transition-all duration-200"
                      onClick={() => handleEdit(quiz)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 transition-all duration-200"
                      onClick={() => handleDelete(quiz.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminDashboard>
  );
}
