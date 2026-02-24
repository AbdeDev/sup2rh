import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Loader2, Briefcase } from "lucide-react";

import { getJobs, deleteJob, type Job } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { AdminDashboard } from "./AdminDashboard";
import { AdminJobForm } from "./AdminJobForm";

export function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const { items } = await getJobs();
      setJobs(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Es-tu sûr de vouloir supprimer cette fiche métier ?")) return;
    try {
      await deleteJob(id);
      await loadJobs();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
  }

  function handleEdit(job: Job) {
    setEditingJob(job);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingJob(null);
    loadJobs();
  }

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-1">
              Fiches métier RH
            </h1>
            <p className="text-xs text-muted-foreground">
              Gère les fiches métier et leurs informations
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle fiche
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

        {showForm && <AdminJobForm job={editingJob || undefined} onClose={handleFormClose} />}

        {loading ? (
          <div className="flex items-center justify-center py-12 animate-in fade-in duration-300">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <Card className="border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Aucune fiche métier</p>
              <Button
                onClick={() => setShowForm(true)}
                className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer la première fiche
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job, index) => (
              <Card
                key={job.id}
                className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer group animate-in fade-in slide-in-from-bottom-4 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate mb-1.5 group-hover:text-primary transition-colors duration-200">
                        {job.name}
                      </h3>
                      {job.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {job.salary && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Salaire :</span>{" "}
                        <span className="text-foreground font-medium">{job.salary}</span>
                      </div>
                    )}
                    {job.hiringRate !== undefined && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Taux d&apos;embauche :</span>{" "}
                        <span className="text-foreground font-medium">{job.hiringRate}%</span>
                      </div>
                    )}
                    {job.turnoverRate !== undefined && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Taux de turnover :</span>{" "}
                        <span className="text-foreground font-medium">{job.turnoverRate}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs flex-1 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                      onClick={() => handleEdit(job)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 transition-all duration-200"
                      onClick={() => handleDelete(job.id)}
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
