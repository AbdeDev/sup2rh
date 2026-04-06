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
  Trash2,
  Check,
  BarChart3,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { deleteQuizSession, getQuizSessions, type QuizSession } from "../lib/api";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { AppLogo } from "../components/AppLogo";
import { useTranslation } from "react-i18next";

export function SessionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      setLoadError(e instanceof Error ? e.message : t("sessions.loadErrorFallback"));
    } finally {
      setLoading(false);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }
  function isSelected(id: string) {
    return selectedIds.includes(id);
  }
  function selectAll() {
    setSelectedIds([...completedSessions, ...inProgressSessions].map((s) => s.id));
  }
  function deselectAll() {
    setSelectedIds([]);
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0 || deleting) return;
    if (!confirm(t("sessions.deleteConfirm", { count: selectedIds.length }))) return;
    setDeleting(true);
    try {
      for (const id of selectedIds) {
        try {
          await deleteQuizSession(id);
        } catch {
          /* skip */
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
    if (!id) return t("sessions.inProgress");
    return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredSessions = useMemo(() => {
    if (!dateFrom && !dateTo) return sessions;
    const fromTime = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : 0;
    const toTime = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Number.MAX_SAFE_INTEGER;
    return sessions.filter((s) => {
      const sessionTime = new Date(s.createdAt).getTime();
      return sessionTime >= fromTime && sessionTime <= toTime;
    });
  }, [sessions, dateFrom, dateTo]);

  const completedSessions = filteredSessions.filter((s) => s.finalJobId);
  const inProgressSessions = filteredSessions.filter((s) => !s.finalJobId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            aria-label={t("nav.home")}
          >
            <AppLogo className="h-9 w-9 object-contain" />
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                RH&MOI <span className="font-normal text-muted-foreground">by</span> SUP des RH
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                {t("nav.sessions")}
              </span>
            </div>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <User className="h-4 w-4" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-card py-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("nav.profile")}
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* Hero banner */}
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-card to-[#008c54]/5">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#f37021]/5 blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold mb-3">
                  <BarChart3 className="h-3 w-3" />
                  {t("sessions.history")}
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-1.5">
                  {t("sessions.title")}
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">
                  {filteredSessions.length === sessions.length
                    ? sessions.length === 0
                      ? t("sessions.heroSubtitleEmpty")
                      : `${t("sessions.sessionCount", { count: sessions.length })} — ${t("sessions.exploreResults")}`
                    : t("sessions.filteredOfTotal", {
                        filtered: filteredSessions.length,
                        total: sessions.length,
                        count: sessions.length,
                      })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs border-border rounded-xl"
                  onClick={() => setFilterOpen((o) => !o)}
                >
                  <CalendarRangeIcon className="h-3.5 w-3.5 mr-1.5" />
                  {t("sessions.filterByDate")}
                </Button>
                <Button
                  onClick={() => navigate("/quiz/start")}
                  className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t("sessions.newQuiz")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats */}
            {sessions.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 text-center hover:shadow-md transition-shadow">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t("sessions.total")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 text-center hover:shadow-md transition-shadow">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-2">
                    <Trophy className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-success">{completedSessions.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t("sessions.completed")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 text-center hover:shadow-md transition-shadow">
                  <div
                    className="h-9 w-9 mx-auto rounded-xl flex items-center justify-center mb-2"
                    style={{
                      background: "rgba(243,112,33,0.1)",
                      border: "1px solid rgba(243,112,33,0.2)",
                    }}
                  >
                    <Clock className="h-4 w-4" style={{ color: "#f37021" }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "#f37021" }}>
                    {inProgressSessions.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t("sessions.inProgress")}
                  </p>
                </div>
              </div>
            )}

            {/* Selection controls */}
            {filteredSessions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] text-muted-foreground"
                  onClick={selectAll}
                >
                  {t("sessions.selectAll")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] text-muted-foreground"
                  onClick={deselectAll}
                >
                  {t("sessions.deselectAll")}
                </Button>
                {selectedIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/5 rounded-lg"
                    disabled={deleting}
                    onClick={handleDeleteSelected}
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1.5" />
                    )}
                    {t("common.delete")} ({selectedIds.length})
                  </Button>
                )}
              </div>
            )}

            {filterOpen && (
              <div className="mb-4 p-4 rounded-xl border border-border bg-card animate-in fade-in slide-in-from-top-2 duration-200">
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
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-in fade-in duration-300">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {t("sessions.loadError")}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">{loadError}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={loadSessions}>
                {t("sessions.retry")}
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-[#008c54]/10 border border-primary/20 flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#f37021]/10 border border-[#f37021]/20 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-[#f37021]" />
                </div>
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                {t("sessions.welcome")}
              </h2>
              <p className="text-sm text-muted-foreground mb-2 max-w-sm">
                {t("sessions.welcomeDesc")}
              </p>
              <p className="text-xs text-muted-foreground/70 mb-6 max-w-xs">
                2 minutes, 100% gratuit, analyse IA personnalisée
              </p>
              <Button
                onClick={() => navigate("/quiz/start")}
                className="h-12 px-8 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("sessions.startFirst")}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {completedSessions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-7 w-7 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                      <Trophy className="h-3.5 w-3.5 text-success" />
                    </div>
                    <h2 className="text-sm font-heading font-bold text-foreground">
                      {t("sessions.completed")}
                    </h2>
                    <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
                      {completedSessions.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedSessions.map((session, index) => (
                      <Card
                        key={session.id}
                        className={`rounded-2xl border bg-card transition-all duration-300 cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-4 ${
                          isSelected(session.id)
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40"
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() =>
                          navigate(`/result/${session.id}`, { state: { sessionSummary: session } })
                        }
                      >
                        <CardContent className="p-5 flex flex-col min-h-[120px]">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                                <Trophy className="h-5 w-5 text-success" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-heading font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                  {jobLabel(session.finalJobId)}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {session.answerCount ?? 0} {t("sessions.answers")} ·{" "}
                                  {formatDate(session.createdAt)}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 opacity-70 group-hover:opacity-100 mt-1" />
                          </div>
                          <div className="flex items-center justify-between pt-3 mt-auto border-t border-border">
                            <span className="text-[11px] font-medium text-primary group-hover:underline">
                              {t("sessions.seeResult")}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelected(session.id);
                              }}
                              className={`h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected(session.id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background hover:border-primary/50"
                              }`}
                            >
                              {isSelected(session.id) && <Check className="h-3 w-3" />}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {inProgressSessions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(243,112,33,0.1)",
                        border: "1px solid rgba(243,112,33,0.2)",
                      }}
                    >
                      <Clock className="h-3.5 w-3.5" style={{ color: "#f37021" }} />
                    </div>
                    <h2 className="text-sm font-heading font-bold text-foreground">
                      {t("sessions.inProgress")}
                    </h2>
                    <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
                      {inProgressSessions.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressSessions.map((session, index) => (
                      <Card
                        key={session.id}
                        className={`rounded-2xl border bg-card transition-all duration-300 cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-4 ${
                          isSelected(session.id) ? "ring-2" : "border-border"
                        }`}
                        style={{
                          animationDelay: `${(completedSessions.length + index) * 50}ms`,
                          ...(isSelected(session.id)
                            ? ({
                                borderColor: "#f37021",
                                "--tw-ring-color": "rgba(243,112,33,0.3)",
                              } as React.CSSProperties)
                            : {}),
                        }}
                        onClick={() => navigate(`/quiz/start?sessionId=${session.id}`)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-xl flex items-center justify-center"
                                style={{
                                  background: "rgba(243,112,33,0.1)",
                                  border: "1px solid rgba(243,112,33,0.2)",
                                }}
                              >
                                <Clock className="h-5 w-5" style={{ color: "#f37021" }} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-heading font-bold text-foreground truncate">
                                  {t("sessions.quizInProgress")}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {session.answerCount ?? 0} {t("sessions.answers")}
                                </p>
                              </div>
                            </div>
                            <ArrowRight
                              className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                              style={{ color: "#f37021" }}
                            />
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span title={formatFullDate(session.createdAt)}>
                                {formatDate(session.createdAt)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelected(session.id);
                              }}
                              className={`h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected(session.id)
                                  ? "text-white"
                                  : "border-border bg-background hover:border-[#f37021]/50"
                              }`}
                              style={
                                isSelected(session.id)
                                  ? { borderColor: "#f37021", background: "#f37021" }
                                  : {}
                              }
                            >
                              {isSelected(session.id) && <Check className="h-3 w-3" />}
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
