import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, DollarSign, TrendingUp, ArrowLeft, Search, Inbox } from "lucide-react";

import { getJobs, type JobFiche } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { AppLogo } from "../components/AppLogo";

const JOB_COLORS = ["#004080", "#008c54", "#f37021", "#6b21a8", "#0891b2"];

export function FichesPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobFiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getJobs()
      .then(({ items }) => setJobs(items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = search.trim()
    ? jobs.filter(
        (j) =>
          j.name.toLowerCase().includes(search.toLowerCase()) ||
          j.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : jobs;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="Accueil"
          >
            <AppLogo className="h-9 w-9 object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                Quiz SupdesRH
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Fiches métier</p>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
              onClick={() => navigate("/login")}
            >
              Se connecter
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Retour
              </Button>
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Fiches métiers RH
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
              Découvre les différents métiers des Ressources Humaines et trouve celui qui te
              correspond.
            </p>

            {jobs.length > 3 && (
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un métier…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des fiches…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  getJobs()
                    .then(({ items }) => setJobs(items))
                    .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
                    .finally(() => setLoading(false));
                }}
              >
                Réessayer
              </Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Aucune fiche ne correspond à ta recherche."
                  : "Aucune fiche métier disponible."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job, idx) => {
                const color = JOB_COLORS[idx % JOB_COLORS.length];
                return (
                  <Card
                    key={job.id}
                    className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-opacity-60 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 60}ms`, ["--hover-color" as string]: color }}
                  >
                    <div
                      className="h-1.5"
                      style={{ background: `linear-gradient(to right, ${color}, ${color}88)` }}
                    />
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                        >
                          <Briefcase className="h-5 w-5" style={{ color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-heading font-bold text-foreground">
                            {job.name}
                          </h3>
                          {job.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {(job.salary || job.hiringRate != null || job.turnover) && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                          {job.salary && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground rounded-lg bg-muted/50 px-2 py-1">
                              <DollarSign className="h-3 w-3" style={{ color }} />
                              {job.salary}
                            </span>
                          )}
                          {job.hiringRate != null && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground rounded-lg bg-muted/50 px-2 py-1">
                              <TrendingUp className="h-3 w-3" style={{ color }} />
                              {job.hiringRate}% embauche
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
