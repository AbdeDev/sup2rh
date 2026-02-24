import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Briefcase,
  Search,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import { getJobs, deleteJob, type Job } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AdminDashboard } from "./AdminDashboard";
import { AdminJobForm } from "./AdminJobForm";

export function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [search, setSearch] = useState("");

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

  const filteredJobs = search.trim()
    ? jobs.filter(
        (j) =>
          j.name.toLowerCase().includes(search.toLowerCase()) ||
          j.id.toLowerCase().includes(search.toLowerCase()),
      )
    : jobs;

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">
                Fiches métier RH
              </h1>
              <p className="text-xs text-muted-foreground">
                {jobs.length} fiche{jobs.length > 1 ? "s" : ""} métier
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle fiche
            </Button>
          </div>

          {jobs.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une fiche…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm pl-9 border-border"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs animate-in fade-in">
            {error}
          </div>
        )}

        {showForm && <AdminJobForm job={editingJob || undefined} onClose={handleFormClose} />}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 animate-in fade-in duration-300">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Chargement des fiches…</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="border border-border bg-card rounded-2xl animate-in fade-in duration-500">
            <CardContent className="p-10 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {search ? "Aucun résultat" : "Aucune fiche métier"}
              </p>
              {!search && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="mt-4 h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première fiche
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job, index) => (
              <Card
                key={job.id}
                className="group rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CardContent className="p-0">
                  {/* Colored top bar */}
                  <div className="h-1.5 bg-gradient-to-r from-primary via-success to-orange" />

                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                        <Briefcase className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-heading font-bold text-foreground truncate mb-0.5 group-hover:text-primary transition-colors">
                          {job.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {job.id}
                        </p>
                      </div>
                    </div>

                    {job.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                        {job.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.salary && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted/50 border border-border px-2 py-1 text-[11px] text-foreground">
                          <DollarSign className="h-3 w-3 text-success" />
                          {job.salary}
                        </span>
                      )}
                      {job.hiringRate !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-success/5 border border-success/20 px-2 py-1 text-[11px] text-success font-medium">
                          <TrendingUp className="h-3 w-3" />
                          {job.hiringRate}%
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs flex-1 rounded-lg border-border hover:border-primary/40 hover:text-primary transition-colors"
                        onClick={() => handleEdit(job)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(job.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
