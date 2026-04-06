import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  DollarSign,
  TrendingUp,
  Play,
  ExternalLink,
} from "lucide-react";

import { getJobs, type JobFiche } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { AppLogo } from "../components/AppLogo";

function FormatDescription({ text }: { text: string }) {
  const parts = text.split(/\s*•\s*/).filter(Boolean);
  if (parts.length <= 1) {
    return <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }
  const intro = parts[0].trim();
  const bullets = parts.slice(1);
  return (
    <div className="space-y-2">
      {intro && <p className="text-sm text-foreground/90 leading-relaxed">{intro}</p>}
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-sm text-foreground/90 leading-relaxed">{b.trim()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FicheDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobFiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Identifiant manquant");
      return;
    }
    getJobs()
      .then(({ items }) => {
        const found = items.find((j) => j.id === id) ?? null;
        setJob(found);
        if (!found) setError("Fiche métier introuvable");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement de la fiche…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-4">
        <p className="text-sm text-destructive text-center">{error || "Fiche introuvable"}</p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/fiches")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux fiches
        </Button>
      </div>
    );
  }

  const rawUrl = (job.videoUrl?.trim() ?? "").replace(/^\/+/, "");
  const isAbsoluteVideo = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
  const isYoutube =
    rawUrl &&
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/.exec(rawUrl);
  const isVimeo = rawUrl && /vimeo\.com\/(?:video\/)?(\d+)/.exec(rawUrl);
  const embedUrl = isYoutube
    ? `https://www.youtube.com/embed/${isYoutube[1]}?rel=0`
    : isVimeo
      ? `https://player.vimeo.com/video/${isVimeo[1]}`
      : null;
  const videoHref = isAbsoluteVideo
    ? rawUrl
    : rawUrl
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/${rawUrl}`.replace(
          /([^:]\/)\/+/g,
          "$1",
        )
      : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/fiches")}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            <AppLogo className="h-8 w-8 object-contain" />
            <span className="hidden sm:block text-sm font-heading font-bold text-foreground">
              Fiche métier
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-xl"
              onClick={() => navigate("/quiz")}
            >
              Faire le quiz
            </Button>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6">
          <button
            type="button"
            onClick={() => navigate("/fiches")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux fiches
          </button>

          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                {job.name}
              </h1>
              {job.category && <p className="text-sm text-muted-foreground mt-1">{job.category}</p>}
            </div>
          </div>

          {(job.salary || job.hiringRate != null || job.turnoverRate != null) && (
            <Card className="border border-border bg-card">
              <CardContent className="p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Indicateurs
                </p>
                <div className="flex flex-wrap gap-3">
                  {job.salary && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      <DollarSign className="h-4 w-4 text-primary" />
                      {job.salary}
                    </span>
                  )}
                  {job.hiringRate != null && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      <TrendingUp className="h-4 w-4 text-success" />
                      Taux d&apos;embauche : {job.hiringRate}%
                    </span>
                  )}
                  {job.turnoverRate != null && (
                    <span className="text-sm text-muted-foreground">
                      Turnover : {job.turnoverRate}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {job.description && (
            <Card className="border border-border bg-card">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Description
                </p>
                <FormatDescription text={job.description} />
              </CardContent>
            </Card>
          )}

          {job.indicators && job.indicators.length > 0 && (
            <Card className="border border-border bg-card">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Autres indicateurs
                </p>
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2">
                  {job.indicators.map((ind, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                    >
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 break-words">
                        {ind.label}
                      </p>
                      <p className="text-xs font-semibold text-foreground break-words">
                        {String(ind.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {rawUrl && (
            <Card className="border border-border bg-card">
              <CardContent className="p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Vidéo explicative
                </p>
                <div className="rounded-xl overflow-hidden border border-border bg-muted/20 aspect-video w-full">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title="Vidéo du métier"
                      className="w-full h-full min-h-[200px]"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isAbsoluteVideo ? (
                    <video
                      src={rawUrl}
                      controls
                      className="w-full h-full min-h-[200px]"
                      playsInline
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-muted/30 text-muted-foreground text-sm p-4 text-center">
                      Lecture non disponible ici. Utilise le bouton ci-dessous pour ouvrir la vidéo.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = videoHref || rawUrl;
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Ouvrir la vidéo dans un nouvel onglet
                </button>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/quiz/start")}
              className="rounded-xl gap-2"
              style={{ backgroundColor: "#004080", color: "#fff" }}
            >
              Faire le quiz
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/fiches")}>
              Voir toutes les fiches
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                const url =
                  import.meta.env.VITE_LANDING_URL || "https://quizsupdesrh-web.pages.dev";
                window.location.href = url;
              }}
            >
              Revenir à la page de présentation
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
