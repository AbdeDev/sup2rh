import { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Phone,
  Loader2,
  Calendar,
  CalendarRange as CalendarRangeIcon,
  Briefcase,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Trophy,
  Search,
  Inbox,
  Download,
} from "lucide-react";

import { getContactRequests, downloadCsv, type ContactRequestUserItem } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { SessionResultModal } from "../../components/SessionResultModal";
import { AdminDashboard } from "./AdminDashboard";

export function AdminContactRequestsPage() {
  const [items, setItems] = useState<ContactRequestUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [resultSessionId, setResultSessionId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.email.toLowerCase().includes(q));
    }
    if (dateFrom || dateTo) {
      const fromTime = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : 0;
      const toTime = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Number.MAX_SAFE_INTEGER;
      result = result.filter((user) => {
        const t = new Date(user.contactRequestedAt).getTime();
        return t >= fromTime && t <= toTime;
      });
    }
    return result;
  }, [items, dateFrom, dateTo, search]);

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

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">
                Demandes de contact
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length === items.length
                  ? `${items.length} demande${items.length > 1 ? "s" : ""} au total`
                  : `${filteredItems.length} sur ${items.length} demande(s)`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs rounded-lg"
                onClick={() => downloadCsv("contact-requests")}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exporter CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs rounded-lg"
                onClick={() => setFilterOpen((o) => !o)}
              >
                <CalendarRangeIcon className="h-3.5 w-3.5 mr-1.5" />
                Filtrer par date
              </Button>
            </div>
          </div>

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

          {items.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email…"
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Chargement des demandes…</p>
          </div>
        ) : items.length === 0 ? (
          <Card className="border border-border rounded-2xl">
            <CardContent className="p-12 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">Aucune demande</p>
              <p className="text-xs text-muted-foreground">
                Les demandes de contact apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((user, idx) => (
              <Card
                key={user.userId}
                className="border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <CardContent className="p-0">
                  <div
                    className="flex flex-col md:flex-row md:items-center gap-3 p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedUserId(expandedUserId === user.userId ? null : user.userId)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate block">
                            {user.email}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {user.sessions.length} session{user.sessions.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground ml-10">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Contact demandé le {formatDate(user.contactRequestedAt)}
                        </span>
                        {user.phone && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                      {expandedUserId === user.userId ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {expandedUserId === user.userId && (
                    <div className="border-t border-border bg-muted/10 p-4 space-y-3 animate-in fade-in duration-200">
                      {user.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="group p-3.5 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {session.finalJobId ? (
                                <Trophy className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="text-xs font-medium text-foreground">
                                {session.jobName ??
                                  (session.finalJobId ? session.finalJobId : "En cours")}
                              </span>
                            </div>
                            {session.finalJobId && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] rounded-lg shrink-0 hover:border-primary/40 hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResultSessionId(session.id);
                                }}
                              >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Résultat
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>{session.answerCount} réponses</span>
                            <span>·</span>
                            <span>{formatDate(session.createdAt)}</span>
                          </div>
                          {session.scores && Object.keys(session.scores).length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {Object.entries(session.scores)
                                .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                                .slice(0, 3)
                                .map(([jid, s]) => (
                                  <span
                                    key={jid}
                                    className="inline-flex items-center rounded-full bg-muted/50 border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                                  >
                                    {Math.round((s ?? 0) * 100)}%
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

      {resultSessionId && (
        <SessionResultModal sessionId={resultSessionId} onClose={() => setResultSessionId(null)} />
      )}
    </AdminDashboard>
  );
}
