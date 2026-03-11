import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Loader2,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Search,
  Inbox,
  Play,
  ChevronRight,
  LayoutGrid,
  X,
} from "lucide-react";

import { getJobs, type JobFiche } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { AppLogo } from "../components/AppLogo";

const ACCENT_COLORS = [
  "#004080",
  "#008c54",
  "#f37021",
  "#6b21a8",
  "#0891b2",
  "#be185d",
  "#0f766e",
  "#b45309",
];

function colorForCategory(cat: string, allCats: string[]): string {
  const idx = allCats.indexOf(cat);
  return ACCENT_COLORS[idx % ACCENT_COLORS.length];
}

export function FichesPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobFiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    getJobs()
      .then(({ items }) => setJobs(items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    jobs.forEach((j) => {
      if (j.category) cats.add(j.category);
    });
    return Array.from(cats).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (activeCategory) result = result.filter((j) => j.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.name.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.category?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [jobs, search, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory || search.trim()) return null;
    const map = new Map<string, JobFiche[]>();
    const uncategorized: JobFiche[] = [];
    jobs.forEach((j) => {
      if (j.category) {
        const arr = map.get(j.category) ?? [];
        arr.push(j);
        map.set(j.category, arr);
      } else {
        uncategorized.push(j);
      }
    });
    if (uncategorized.length > 0) map.set("Autres", uncategorized);
    return map;
  }, [jobs, activeCategory, search]);

  function reload() {
    setError(null);
    setLoading(true);
    getJobs()
      .then(({ items }) => setJobs(items))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="Accueil"
          >
            <AppLogo className="h-9 w-9 object-contain" />
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                Rh et moi <span className="font-normal text-muted-foreground">by</span> SUP des RH
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                Fiches métier
              </span>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => navigate("/quiz/start")}
              size="sm"
              className="h-8 text-xs gap-1.5 hidden sm:flex rounded-xl"
              style={{ backgroundColor: "#004080", color: "#fff" }}
            >
              Faire le quiz
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Page header */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour
            </button>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-2.5">
                  <LayoutGrid className="h-7 w-7 text-primary shrink-0" />
                  Fiches métiers RH
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {jobs.length > 0
                    ? `${jobs.length} fiche${jobs.length > 1 ? "s" : ""} · ${categories.length} domaine${categories.length > 1 ? "s" : ""}`
                    : "Découvre les métiers des Ressources Humaines"}
                </p>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un métier…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category filters */}
            {categories.length > 0 && !search && (
              <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    !activeCategory
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  Tous ({jobs.length})
                </button>
                {categories.map((cat) => {
                  const count = jobs.filter((j) => j.category === cat).length;
                  const color = colorForCategory(cat, categories);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                        activeCategory === cat
                          ? "text-white border-transparent"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                      style={
                        activeCategory === cat ? { backgroundColor: color, borderColor: color } : {}
                      }
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des fiches…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-destructive" />
              </div>
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={reload}>
                Réessayer
              </Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Aucun résultat</p>
              <p className="text-xs text-muted-foreground">
                {search
                  ? `Aucune fiche ne correspond à "${search}"`
                  : "Aucune fiche disponible dans ce domaine."}
              </p>
              {(search || activeCategory) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl mt-1"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(null);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : grouped ? (
            /* Grouped by category */
            <div className="space-y-10">
              {Array.from(grouped.entries()).map(([cat, catJobs]) => {
                const color = cat === "Autres" ? "#64748b" : colorForCategory(cat, categories);
                return (
                  <section key={cat}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-1 w-8 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <h2 className="text-base font-heading font-bold text-foreground">{cat}</h2>
                      <span className="text-xs text-muted-foreground">
                        {catJobs.length} fiche{catJobs.length > 1 ? "s" : ""}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {catJobs.map((job, idx) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          color={color}
                          delay={idx * 50}
                          onSelect={() => navigate(`/fiches/${job.id}`)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            /* Flat filtered list */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map((job, idx) => {
                const color = job.category
                  ? colorForCategory(job.category, categories)
                  : ACCENT_COLORS[idx % ACCENT_COLORS.length];
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    color={color}
                    delay={idx * 50}
                    onSelect={() => navigate(`/fiches/${job.id}`)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* CTA Quiz */}
        {!loading && jobs.length > 0 && (
          <div className="border-t border-border bg-card/50">
            <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-heading font-semibold text-foreground">
                  Tu ne sais pas par où commencer ?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fais le quiz pour découvrir ton domaine RH idéal.
                </p>
              </div>
              <Button
                onClick={() => navigate("/quiz/start")}
                className="shrink-0 gap-2 rounded-xl h-10 px-5 text-sm"
                style={{ backgroundColor: "#004080", color: "#fff" }}
              >
                Faire le quiz
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function JobCard({
  job,
  color,
  delay,
  onSelect,
}: {
  job: JobFiche;
  color: string;
  delay: number;
  onSelect: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent bar */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(to right, ${color}, ${color}55)` }}
      />
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300"
            style={{ background: `${color}12`, border: `1px solid ${color}25` }}
          >
            <Briefcase className="h-5 w-5" style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-heading font-bold text-foreground leading-snug">
              {job.name}
            </h3>
            {job.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        {(job.salary || job.hiringRate != null || job.turnoverRate != null) && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
            {job.salary && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground rounded-lg bg-muted/60 px-2 py-0.5">
                <DollarSign className="h-2.5 w-2.5" style={{ color }} />
                {job.salary}
              </span>
            )}
            {job.hiringRate != null && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground rounded-lg bg-muted/60 px-2 py-0.5">
                <TrendingUp className="h-2.5 w-2.5" style={{ color }} />
                {job.hiringRate}% embauche
              </span>
            )}
            {job.videoUrl && (
              <span
                className="inline-flex items-center gap-1 text-[10px] rounded-lg px-2 py-0.5 font-medium"
                style={{ color, background: `${color}12` }}
              >
                <Play className="h-2.5 w-2.5" />
                Vidéo
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
