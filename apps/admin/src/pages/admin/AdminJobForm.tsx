import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";

import {
  createJob,
  updateJob,
  getJobCategories,
  type Job,
  type CreateJobRequest,
  type UpdateJobRequest,
  type JobIndicator,
  type JobCategory,
} from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";

function parseIndicators(
  indicators: JobIndicator[] | Record<string, unknown> | undefined,
): JobIndicator[] {
  if (!indicators) return [];
  if (Array.isArray(indicators)) {
    return indicators.filter((i) => i && typeof i.label === "string");
  }
  return Object.entries(indicators).map(([label, value]) => ({
    label,
    value: typeof value === "number" ? value : String(value ?? ""),
  }));
}

interface AdminJobFormProps {
  job?: Job;
  onClose: () => void;
}

export function AdminJobForm({ job, onClose }: AdminJobFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);

  useEffect(() => {
    getJobCategories()
      .then(({ items }) => setCategories(items))
      .catch(() => {
        /* silently ignore, fallback to empty list */
      });
  }, []);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    salary: "",
    hiringRate: "",
    turnoverRate: "",
    videoUrl: "",
    category: "",
    indicators: [] as JobIndicator[],
  });

  useEffect(() => {
    if (job) {
      setFormData({
        id: job.id,
        name: job.name,
        description: job.description || "",
        salary: job.salary || "",
        hiringRate: job.hiringRate?.toString() || "",
        turnoverRate: job.turnoverRate?.toString() || "",
        videoUrl: job.videoUrl || "",
        category: job.category || "",
        indicators: parseIndicators(
          job.indicators as JobIndicator[] | Record<string, unknown> | undefined,
        ),
      });
    }
  }, [job]);

  function addIndicator() {
    setFormData((prev) => ({
      ...prev,
      indicators: [...prev.indicators, { label: "", value: "" }],
    }));
  }

  function removeIndicator(index: number) {
    setFormData((prev) => ({
      ...prev,
      indicators: prev.indicators.filter((_, i) => i !== index),
    }));
  }

  function updateIndicator(index: number, field: "label" | "value", val: string) {
    setFormData((prev) => ({
      ...prev,
      indicators: prev.indicators.map((item, i) =>
        i !== index
          ? item
          : {
              ...item,
              [field]: field === "value" && /^-?[\d.]+$/.test(val) ? parseFloat(val) || val : val,
            },
      ),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const indicators = formData.indicators
        .filter((i) => i.label.trim() !== "")
        .map((i) => ({ label: i.label.trim(), value: i.value }));

      if (job) {
        const updateData: UpdateJobRequest = {
          name: formData.name,
          description: formData.description || undefined,
          salary: formData.salary || undefined,
          hiringRate: formData.hiringRate ? parseFloat(formData.hiringRate) : undefined,
          turnoverRate: formData.turnoverRate ? parseFloat(formData.turnoverRate) : undefined,
          videoUrl: formData.videoUrl || undefined,
          category: formData.category || undefined,
          indicators: indicators.length ? indicators : undefined,
        };
        await updateJob(job.id, updateData);
      } else {
        if (!formData.id) {
          throw new Error("L'ID est requis");
        }
        const createData: CreateJobRequest = {
          id: formData.id,
          name: formData.name,
          description: formData.description || undefined,
          salary: formData.salary || undefined,
          hiringRate: formData.hiringRate ? parseFloat(formData.hiringRate) : undefined,
          turnoverRate: formData.turnoverRate ? parseFloat(formData.turnoverRate) : undefined,
          videoUrl: formData.videoUrl || undefined,
          category: formData.category || undefined,
          indicators: indicators.length ? indicators : undefined,
        };
        await createJob(createData);
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-card text-card-foreground shadow-2xl rounded-2xl animate-in scale-in duration-200">
        <CardHeader className="flex items-center justify-between pb-3 px-6 pt-5 border-b border-border">
          <h2 className="text-lg font-heading font-bold text-foreground">
            {job ? "Modifier la fiche métier" : "Nouvelle fiche métier"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                {error}
              </div>
            )}

            {!job && (
              <div className="space-y-2">
                <Label htmlFor="id" className="text-xs text-muted-foreground">
                  ID du métier <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="ex: hr-business-partner"
                  required
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Identifiant unique (minuscules, tirets autorisés)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Nom du métier <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: HR Business Partner"
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs text-muted-foreground">
                Grand domaine RH
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Aucun domaine —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.emoji ? `${cat.emoji} ` : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                {categories.length > 0
                  ? `${categories.length} domaines disponibles · Gérer dans "Domaines RH"`
                  : "Aucun domaine créé — va dans Domaines RH pour en créer"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée du métier..."
                rows={4}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-xs text-muted-foreground">
                  Salaire
                </Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="ex: 35k€ - 50k€"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hiringRate" className="text-xs text-muted-foreground">
                  Taux d&apos;embauche (%)
                </Label>
                <Input
                  id="hiringRate"
                  type="number"
                  step="0.1"
                  value={formData.hiringRate}
                  onChange={(e) => setFormData({ ...formData, hiringRate: e.target.value })}
                  placeholder="ex: 85.5"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turnoverRate" className="text-xs text-muted-foreground">
                  Taux de turnover (%)
                </Label>
                <Input
                  id="turnoverRate"
                  type="number"
                  step="0.1"
                  value={formData.turnoverRate}
                  onChange={(e) => setFormData({ ...formData, turnoverRate: e.target.value })}
                  placeholder="ex: 12.3"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-xs text-muted-foreground">
                  URL vidéo
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://..."
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Indicateurs supplémentaires (chiffre ou texte)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 border-border"
                  onClick={addIndicator}
                >
                  <Plus className="h-3 w-3" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 dark:bg-muted/60 p-3">
                {formData.indicators.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground py-1">
                    Aucun indicateur. Cliquez sur &quot;Ajouter&quot; pour en saisir (ex. Taux de
                    pénurie, Évolution…).
                  </p>
                ) : (
                  formData.indicators.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Libellé (ex. Taux de pénurie)"
                        value={item.label}
                        onChange={(e) => updateIndicator(index, "label", e.target.value)}
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        placeholder="Valeur (ex. 12% ou 5.2)"
                        value={String(item.value)}
                        onChange={(e) => updateIndicator(index, "value", e.target.value)}
                        className="h-8 text-sm w-28"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeIndicator(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-border mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 text-sm flex-1 rounded-xl border-border text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 text-sm flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.01] shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement…
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
