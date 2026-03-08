import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2, GripVertical } from "lucide-react";

import { createQuiz, updateQuiz, type QuizDefinition, type Job } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface Question {
  id: string;
  text: string;
  answers: Array<{ id: string; label: string }>;
}

interface AdminQuizFormProps {
  quiz?: QuizDefinition;
  jobs: Job[];
  onClose: () => void;
}

function makeId(prefix: string, num: number) {
  return `${prefix}${num}`;
}

export function AdminQuizForm({ quiz, jobs, onClose }: AdminQuizFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ jobId: "", name: "" });
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (quiz) {
      setFormData({ jobId: quiz.jobId, name: quiz.name });
      setQuestions(quiz.questions);
    } else {
      setFormData((prev) => ({
        ...prev,
        jobId: prev.jobId || (jobs.length > 0 ? jobs[0].id : ""),
      }));
      if (questions.length === 0) {
        setQuestions([{ id: "q1", text: "", answers: [] }]);
      }
    }
  }, [quiz]);

  useEffect(() => {
    if (!quiz && jobs.length > 0) {
      setFormData((prev) => ({ ...prev, jobId: prev.jobId || jobs[0].id }));
    }
  }, [quiz, jobs]);

  function addQuestion() {
    const num = questions.length + 1;
    setQuestions([...questions, { id: makeId("q", num), text: "", answers: [] }]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: "id" | "text", value: string) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.jobId) {
      setError("Sélectionne un métier RH");
      return;
    }
    if (questions.length === 0) {
      setError("Ajoute au moins une question");
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        setError("Toutes les questions doivent avoir un texte");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        jobId: formData.jobId,
        name: formData.name.trim() || "Sans titre",
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          answers: q.answers,
        })),
      };
      if (quiz) {
        await updateQuiz(quiz.id, payload);
      } else {
        await createQuiz(payload);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-card shadow-2xl rounded-2xl animate-in scale-in duration-200">
        <CardHeader className="flex items-center justify-between pb-3 px-6 pt-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-heading font-bold text-foreground">
            {quiz ? "Modifier le quiz" : "Nouveau quiz"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in">
                {error}
              </div>
            )}

            {/* Métier */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Métier RH <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.jobId}
                onValueChange={(value) => setFormData({ ...formData, jobId: value })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Sélectionne un métier" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nom du quiz</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Quiz HR Business Partner"
                className="h-9 text-sm"
              />
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Questions ({questions.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une question
                </Button>
              </div>

              {questions.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center text-sm text-muted-foreground">
                  Aucune question — clique sur "Ajouter une question"
                </div>
              )}

              <div className="space-y-2">
                {questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="group flex items-start gap-2 rounded-lg border border-border bg-muted/10 p-3"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground/30 mt-0.5 shrink-0" />

                    <div className="flex-1 grid grid-cols-[80px_1fr] gap-2 items-center">
                      <Input
                        value={question.id}
                        onChange={(e) => updateQuestion(qIndex, "id", e.target.value)}
                        placeholder="q1"
                        className="h-8 text-xs font-mono"
                        title="ID de la question"
                      />
                      <Input
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                        placeholder={`Question ${qIndex + 1}…`}
                        className="h-8 text-sm"
                        autoFocus={!quiz && qIndex === questions.length - 1}
                      />
                    </div>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex items-center justify-center rounded text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {questions.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Les réponses sont gérées automatiquement par le moteur du quiz (Oui / Non /
                  Parfois…).
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-10 text-sm rounded-xl"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement…
                  </>
                ) : quiz ? (
                  "Mettre à jour"
                ) : (
                  "Créer le quiz"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
