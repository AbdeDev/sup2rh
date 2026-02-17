import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

import {
  createJob,
  updateJob,
  type Job,
  type CreateJobRequest,
  type UpdateJobRequest,
} from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";

interface AdminJobFormProps {
  job?: Job;
  onClose: () => void;
}

export function AdminJobForm({ job, onClose }: AdminJobFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    salary: "",
    hiringRate: "",
    turnoverRate: "",
    videoUrl: "",
    indicators: "",
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
        indicators: job.indicators ? JSON.stringify(job.indicators, null, 2) : "",
      });
    }
  }, [job]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const indicators = formData.indicators ? JSON.parse(formData.indicators) : undefined;

      if (job) {
        const updateData: UpdateJobRequest = {
          name: formData.name,
          description: formData.description || undefined,
          salary: formData.salary || undefined,
          hiringRate: formData.hiringRate ? parseFloat(formData.hiringRate) : undefined,
          turnoverRate: formData.turnoverRate ? parseFloat(formData.turnoverRate) : undefined,
          videoUrl: formData.videoUrl || undefined,
          indicators,
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
          indicators,
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-card animate-in scale-in duration-200">
        <CardHeader className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-semibold text-foreground">
            {job ? "Modifier la fiche métier" : "Nouvelle fiche métier"}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
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
              <Label htmlFor="indicators" className="text-xs text-muted-foreground">
                Indicateurs supplémentaires (JSON)
              </Label>
              <Textarea
                id="indicators"
                value={formData.indicators}
                onChange={(e) => setFormData({ ...formData, indicators: e.target.value })}
                placeholder='{"tauxCroissance": 5.2, "satisfaction": 4.5}'
                rows={3}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Format JSON pour des indicateurs personnalisés
              </p>
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
