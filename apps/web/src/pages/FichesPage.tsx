import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, ArrowLeft } from "lucide-react";

import { getJobs, type JobFiche } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";

export function FichesPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobFiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJobs()
      .then(({ items }) => setJobs(items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-11 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1 h-8 w-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Button>
          <span className="text-xs font-medium text-foreground">Toutes les fiches métier</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune fiche métier disponible
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id} className="border border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-foreground">{job.name}</h3>
                        {job.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                        {(job.salary || job.hiringRate != null) && (
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {job.salary && <span>{job.salary}</span>}
                            {job.hiringRate != null && (
                              <span>Taux embauche: {job.hiringRate}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
