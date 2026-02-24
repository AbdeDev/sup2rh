import { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Loader2,
  Calendar,
  CalendarRange as CalendarRangeIcon,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getContactRequests, type ContactRequestUserItem } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { AdminDashboard } from "./AdminDashboard";

export function AdminContactRequestsPage() {
  const [items, setItems] = useState<ContactRequestUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!dateFrom && !dateTo) return items;
    const fromTime = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : 0;
    const toTime = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Number.MAX_SAFE_INTEGER;
    return items.filter((user) => {
      const t = new Date(user.contactRequestedAt).getTime();
      return t >= fromTime && t <= toTime;
    });
  }, [items, dateFrom, dateTo]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { items: data } = await getContactRequests();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(s: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));
  }

  const webBase = import.meta.env.VITE_WEB_URL || "http://localhost:5173";

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-1">
                Demandes de contact
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length === items.length
                  ? "Une carte par utilisateur avec toutes ses sessions de quiz"
                  : `${filteredItems.length} sur ${items.length} demande(s)`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => setFilterOpen((o) => !o)}
            >
              <CalendarRangeIcon className="h-3.5 w-3.5 mr-1.5" />
              Filtrer par date
            </Button>
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

        {error && (
          <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune demande de contact pour l&apos;instant
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((user) => (
              <Card
                key={user.userId}
                className="border border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div
                    className="flex flex-col md:flex-row md:items-center gap-3 cursor-pointer"
                    onClick={() =>
                      setExpandedUserId(expandedUserId === user.userId ? null : user.userId)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">{user.email}</span>
                        <span className="text-xs text-muted-foreground">
                          ({user.sessions.length} session{user.sessions.length > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Contact demandé: {formatDate(user.contactRequestedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {expandedUserId === user.userId ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {expandedUserId === user.userId && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in">
                      {user.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-medium text-foreground">
                                {session.jobName ?? "En cours"}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`${webBase}/result/${session.id}`, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Voir résultat
                            </Button>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {session.answerCount} réponses · {formatDate(session.createdAt)}
                          </div>
                          {session.scores && Object.keys(session.scores).length > 0 && (
                            <div className="mt-2 text-[10px]">
                              Scores:{" "}
                              {Object.entries(session.scores)
                                .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                                .slice(0, 3)
                                .map(([jid, s]) => (
                                  <span key={jid} className="mr-2">
                                    {session.jobName ?? jid}: {Math.round((s ?? 0) * 100)}%
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminDashboard>
  );
}
