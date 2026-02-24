import { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Trophy,
  Briefcase,
  User,
  Calendar,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAdminSessionDetail, type AdminSessionDetail } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface SessionResultModalProps {
  sessionId: string;
  onClose: () => void;
}

export function SessionResultModal({ sessionId, onClose }: SessionResultModalProps) {
  const [detail, setDetail] = useState<AdminSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllScores, setShowAllScores] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminSessionDetail(sessionId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const scoresData = useMemo(() => {
    const scores = detail?.analysis?.scores;
    if (!scores || typeof scores !== "object") return [];
    return Object.entries(scores)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      .map(([jId, value]) => ({
        jobId: jId,
        label:
          jId === detail.analysis?.jobId && detail.analysis?.job?.name
            ? detail.analysis.job.name
            : jId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: Math.round((Number(value) || 0) * 100),
        isMain: jId === detail.analysis?.jobId,
      }));
  }, [detail]);

  const INITIAL_VISIBLE = 5;
  const visibleScores = showAllScores ? scoresData : scoresData.slice(0, INITIAL_VISIBLE);
  const hasMoreScores = scoresData.length > INITIAL_VISIBLE;

  function formatDate(s: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));
  }

  const confidencePercent = detail?.analysis ? Math.round(detail.analysis.confidence * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in scale-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-heading font-semibold text-foreground">
                Résultat du quiz
              </h2>
              {detail && <p className="text-[11px] text-muted-foreground">{detail.user.email}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Chargement de l'analyse…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
              <p className="text-sm text-destructive font-medium mb-1">{error}</p>
              <p className="text-xs text-muted-foreground">Vérifie que l'API tourne.</p>
            </div>
          ) : detail ? (
            <>
              {/* Info cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                  <User className="h-4 w-4 text-primary mx-auto mb-1.5" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Utilisateur
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {detail.user.email}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                  <Calendar className="h-4 w-4 text-primary mx-auto mb-1.5" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Date
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {formatDate(detail.session.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                  <FileText className="h-4 w-4 text-success mx-auto mb-1.5" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Réponses
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {detail.session.answers.length}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                  <Trophy className="h-4 w-4 text-orange mx-auto mb-1.5" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    Confiance
                  </p>
                  <p className="text-xs font-bold text-primary">{confidencePercent}%</p>
                </div>
              </div>

              {/* Main result */}
              {detail.analysis ? (
                <>
                  <Card className="border border-primary/20 bg-primary/5">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Métier recommandé
                          </p>
                          <h3 className="text-lg font-heading font-bold text-foreground mb-1">
                            {detail.analysis.job?.name ?? detail.analysis.jobId}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              {confidencePercent}% match
                            </span>
                            {detail.analysis.job?.salary && (
                              <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                                {detail.analysis.job.salary}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {detail.analysis.explanation && (
                        <p className="mt-4 text-sm text-foreground/80 leading-relaxed border-t border-primary/10 pt-4">
                          {detail.analysis.explanation}
                        </p>
                      )}
                      {detail.analysis.job?.description && (
                        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                          {detail.analysis.job.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Job stats */}
                  {(detail.analysis.job?.hiringRate != null ||
                    detail.analysis.job?.turnoverRate != null) && (
                    <div className="grid grid-cols-2 gap-3">
                      {detail.analysis.job?.hiringRate != null && (
                        <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Taux d'embauche
                          </p>
                          <p className="text-xl font-bold text-success">
                            {detail.analysis.job.hiringRate}%
                          </p>
                        </div>
                      )}
                      {detail.analysis.job?.turnoverRate != null && (
                        <div className="rounded-xl border border-orange/20 bg-orange/5 p-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Turnover
                          </p>
                          <p className="text-xl font-bold text-orange">
                            {detail.analysis.job.turnoverRate}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scores chart */}
                  {scoresData.length > 0 && (
                    <Card className="border border-border">
                      <CardContent className="p-5">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                          Comparaison des métiers
                        </p>
                        <p className="text-[11px] text-muted-foreground mb-4">
                          {scoresData.length} métier{scoresData.length > 1 ? "s" : ""} analysé
                          {scoresData.length > 1 ? "s" : ""}
                        </p>
                        <div className="space-y-2">
                          {visibleScores.map((item, idx) => {
                            const barColors = [
                              "#004080",
                              "#008c54",
                              "#f37021",
                              "#0d5aa7",
                              "#16a34a",
                              "#d97706",
                              "#3b82f6",
                              "#10b981",
                            ];
                            const color = item.isMain
                              ? "#004080"
                              : barColors[idx % barColors.length];
                            return (
                              <div key={item.jobId} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`text-xs truncate max-w-[60%] ${item.isMain ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                                  >
                                    {item.label}
                                  </span>
                                  <span
                                    className={`text-xs tabular-nums ${item.isMain ? "font-bold text-primary" : "text-muted-foreground"}`}
                                  >
                                    {item.value}%
                                  </span>
                                </div>
                                <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                      width: `${item.value}%`,
                                      backgroundColor: color,
                                      opacity: item.isMain ? 1 : 0.7,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {hasMoreScores && (
                          <button
                            type="button"
                            className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline mx-auto"
                            onClick={() => setShowAllScores(!showAllScores)}
                          >
                            {showAllScores ? (
                              <>
                                Voir moins <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                Voir les {scoresData.length - INITIAL_VISIBLE} autres{" "}
                                <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border border-border">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Quiz non terminé ou non analysé</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs border-border"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
