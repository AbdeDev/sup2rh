import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Clock,
  Trophy,
  ArrowRight,
  User,
  LogOut,
  Calendar,
  CalendarRange as CalendarRangeIcon,
  Plus,
  Square,
  Check,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { deleteQuizSession, getQuizSessions, type QuizSession } from "../lib/api";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { AppLogo } from "../components/AppLogo";

export function SessionsPage() {
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userMenuOpen]);

  async function loadSessions() {
    setLoading(true);
    setLoadError(null);
    try {
      const { items } = await getQuizSessions();
      setSessions(items);
      setSelectedIds([]);
    } catch (e) {
      console.error("Erreur lors du chargement des sessions:", e);
      setLoadError(
        e instanceof Error
          ? e.message
          : "Impossible de charger les sessions. Vérifie ta connexion.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sessionId) => sessionId !== id) : [...prev, id],
    );
  }

  function isSelected(id: string) {
    return selectedIds.includes(id);
  }

  function selectAll() {
    const allIds = [...completedSessions, ...inProgressSessions].map((s) => s.id);
    setSelectedIds(allIds);
  }

  function deselectAll() {
    setSelectedIds([]);
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0 || deleting) return;

    if (
      !confirm(
        `Supprimer ${selectedIds.length} session${
          selectedIds.length > 1 ? "s" : ""
        } de quiz ? Cette action est définitive.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      for (const id of selectedIds) {
        try {
          await deleteQuizSession(id);
        } catch (e) {
          console.error("Erreur lors de la suppression de la session", id, e);
        }
      }
      await loadSessions();
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    navigate("/login");
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }).format(date);
  }

  function formatFullDate(dateString: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  const jobLabel = (id: string | null) => {
    if (!id) return "En cours";
    return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredSessions = useMemo(() => {
    if (!dateFrom && !dateTo) return sessions;
    const fromTime = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : 0;
    const toTime = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Number.MAX_SAFE_INTEGER;
    return sessions.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= fromTime && t <= toTime;
    });
  }, [sessions, dateFrom, dateTo]);

  const completedSessions = filteredSessions.filter((s) => s.finalJobId);
  const inProgressSessions = filteredSessions.filter((s) => !s.finalJobId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-colors sticky top-0 z-50">
        <div className="flex w-full items-center gap-2 px-4 lg:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/quiz")}
              className="shrink-0 hover:opacity-80 transition-opacity p-0.5 -ml-0.5 rounded"
              aria-label="Accueil"
            >
              <AppLogo className="h-10 w-10 object-contain transition-transform duration-200 hover:scale-110" />
            </button>
            <span className="text-xs font-medium text-foreground truncate">Mes sessions</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <User className="h-4 w-4" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-border bg-card py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors duration-150"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <User className="h-3.5 w-3.5" />
                    Profil
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          {/* Header section */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-heading font-semibold text-foreground mb-2">
                  Mes sessions de quiz
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredSessions.length === sessions.length
                    ? sessions.length === 0
                      ? "Aucune session pour le moment"
                      : `${sessions.length} session${sessions.length > 1 ? "s" : ""} au total`
                    : `${filteredSessions.length} sur ${sessions.length} session${sessions.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {filteredSessions.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs border-border"
                      onClick={selectAll}
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs border-border"
                      onClick={deselectAll}
                    >
                      Tout désélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs border-destructive/40 text-destructive hover:text-destructive hover:bg-destructive/5"
                      disabled={selectedIds.length === 0 || deleting}
                      onClick={handleDeleteSelected}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Suppression…
                        </>
                      ) : (
                        <>
                          Supprimer
                          {selectedIds.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px]">
                              {selectedIds.length}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs border-border"
                  onClick={() => setFilterOpen((o) => !o)}
                >
                  <CalendarRangeIcon className="h-3.5 w-3.5 mr-1.5" />
                  Filtrer par date
                </Button>
                <Button
                  onClick={() => navigate("/quiz/start")}
                  className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau quiz
                </Button>
              </div>
            </div>
            {filterOpen && (
              <div className="mb-4 p-4 rounded-lg border border-border bg-card animate-in fade-in slide-in-from-top-2 duration-200">
                <DateRangeFilter
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateFromChange={setDateFrom}
                  onDateToChange={setDateTo}
                  onClear={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 animate-in fade-in duration-300">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={loadSessions}>
                Réessayer
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-16 w-16 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-heading font-medium text-foreground mb-2">
                Aucune session
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Commence par créer ton premier quiz pour découvrir ton métier RH idéal.
              </p>
              <Button
                onClick={() => navigate("/quiz/start")}
                className="h-10 px-6 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Sessions complétées */}
              {completedSessions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-4 w-4 text-success" />
                    <h2 className="text-sm font-medium text-foreground">Complétées</h2>
                    <span className="text-xs text-muted-foreground">
                      ({completedSessions.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedSessions.map((session, index) => (
                      <Card
                        key={session.id}
                        className={`border bg-card transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 ${
                          isSelected(session.id)
                            ? "border-primary/60 ring-2 ring-primary/40"
                            : "border-border hover:border-primary/50"
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() =>
                          navigate(`/result/${session.id}`, { state: { sessionSummary: session } })
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-success/20 border border-success/30 flex items-center justify-center">
                                <Trophy className="h-4 w-4 text-success" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                                  {jobLabel(session.finalJobId)}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {session.answerCount ?? 0} réponses
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100" />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate" title={formatFullDate(session.createdAt)}>
                                {formatDate(session.createdAt)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelected(session.id);
                              }}
                              className={`ml-2 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected(session.id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:border-primary/50"
                              }`}
                              aria-pressed={isSelected(session.id)}
                              aria-label={
                                isSelected(session.id) ? "Désélectionner" : "Sélectionner"
                              }
                            >
                              {isSelected(session.id) ? (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              ) : (
                                <Square className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions en cours */}
              {inProgressSessions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-orange" />
                    <h2 className="text-sm font-medium text-foreground">En cours</h2>
                    <span className="text-xs text-muted-foreground">
                      ({inProgressSessions.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressSessions.map((session, index) => (
                      <Card
                        key={session.id}
                        className={`border bg-card transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 ${
                          isSelected(session.id)
                            ? "border-orange/60 ring-2 ring-orange/30"
                            : "border-border hover:border-orange/50"
                        }`}
                        style={{ animationDelay: `${(completedSessions.length + index) * 50}ms` }}
                        onClick={() => navigate(`/quiz/start?sessionId=${session.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-orange/20 border border-orange/30 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-orange" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-medium text-foreground truncate group-hover:text-orange transition-colors duration-200">
                                  Quiz en cours
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {session.answerCount ?? 0} réponses
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange group-hover:translate-x-0.5 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100" />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate" title={formatFullDate(session.createdAt)}>
                                {formatDate(session.createdAt)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelected(session.id);
                              }}
                              className={`ml-2 h-5 w-5 shrink-0 rounded-md border text-[10px] flex items-center justify-center transition-colors ${
                                isSelected(session.id)
                                  ? "border-orange bg-orange text-white"
                                  : "border-border bg-card text-muted-foreground hover:bg-muted"
                              }`}
                              aria-pressed={isSelected(session.id)}
                            >
                              {isSelected(session.id) ? "✓" : ""}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
