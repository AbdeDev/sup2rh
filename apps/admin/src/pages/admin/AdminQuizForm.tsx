import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

import {
  createQuiz,
  updateQuiz,
  type QuizDefinition,
  type Job,
  type CreateQuizRequest,
} from "../../lib/api";
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

interface AdminQuizFormProps {
  quiz?: QuizDefinition;
  jobs: Job[];
  onClose: () => void;
}

export function AdminQuizForm({ quiz, jobs, onClose }: AdminQuizFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jobId: "",
    name: "",
  });
  const [questions, setQuestions] = useState<
    Array<{ id: string; text: string; answers: Array<{ id: string; label: string }> }>
  >([]);

  const defaultQuestion = () => [
    {
      id: "q1",
      text: "",
      answers: [
        { id: "a1", label: "" },
        { id: "a2", label: "" },
      ],
    },
  ];

  useEffect(() => {
    if (quiz) {
      setFormData({
        jobId: quiz.jobId,
        name: quiz.name,
      });
      setQuestions(quiz.questions);
    } else {
      setFormData((prev) => ({
        ...prev,
        jobId: prev.jobId || (jobs.length > 0 ? jobs[0].id : ""),
      }));
      setQuestions((prev) => (prev.length ? prev : defaultQuestion()));
    }
  }, [quiz]);

  useEffect(() => {
    if (!quiz && jobs.length > 0) {
      setFormData((prev) => ({ ...prev, jobId: prev.jobId || jobs[0].id }));
    }
  }, [quiz, jobs]);

  function addQuestion() {
    const qNum = questions.length + 1;
    setQuestions([
      ...questions,
      {
        id: `q${qNum}`,
        text: "",
        answers: [
          { id: "a1", label: "" },
          { id: "a2", label: "" },
        ],
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: "id" | "text", value: string) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  }

  function addAnswer(questionIndex: number) {
    const updated = [...questions];
    const q = updated[questionIndex];
    const aNum = q.answers.length + 1;
    q.answers.push({ id: `a${aNum}`, label: "" });
    setQuestions(updated);
  }

  function removeAnswer(questionIndex: number, answerIndex: number) {
    const updated = [...questions];
    updated[questionIndex].answers = updated[questionIndex].answers.filter(
      (_, i) => i !== answerIndex,
    );
    setQuestions(updated);
  }

  function updateAnswer(
    questionIndex: number,
    answerIndex: number,
    field: "id" | "label",
    value: string,
  ) {
    const updated = [...questions];
    updated[questionIndex].answers[answerIndex][field] = value;
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
      if (q.answers.length < 2) {
        setError("Chaque question doit avoir au moins 2 réponses");
        return;
      }
      for (const a of q.answers) {
        if (!a.label.trim()) {
          setError("Toutes les réponses doivent avoir un libellé");
          return;
        }
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
          answers: q.answers.map((a) => ({
            id: a.id,
            label: a.label,
          })),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:border-border animate-in scale-in duration-200">
        <CardHeader className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {quiz ? "Modifier le quiz" : "Nouveau quiz"}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="jobId" className="text-xs text-muted-foreground">
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

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Nom du quiz <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Quiz HR Business Partner"
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Ajouter une question
                </Button>
              </div>

              {questions.map((question, qIndex) => (
                <Card key={qIndex} className="border border-border bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        Question {qIndex + 1}
                      </span>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                          className="h-7 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                      <Label className="text-xs text-muted-foreground">ID</Label>
                      <Input
                        value={question.id}
                        onChange={(e) => updateQuestion(qIndex, "id", e.target.value)}
                        placeholder="q1"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Texte</Label>
                      <Input
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                        placeholder="Texte de la question..."
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Réponses</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addAnswer(qIndex)}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      {question.answers.map((answer, aIndex) => (
                        <div
                          key={aIndex}
                          className="grid grid-cols-[60px_1fr_auto] gap-2 items-center"
                        >
                          <Input
                            value={answer.id}
                            onChange={(e) => updateAnswer(qIndex, aIndex, "id", e.target.value)}
                            placeholder="a1"
                            className="h-8 text-xs font-mono"
                          />
                          <Input
                            value={answer.label}
                            onChange={(e) => updateAnswer(qIndex, aIndex, "label", e.target.value)}
                            placeholder="Libellé de la réponse..."
                            className="h-8 text-sm"
                          />
                          {question.answers.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAnswer(qIndex, aIndex)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-9 text-sm flex-1 border-border text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 text-sm flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
