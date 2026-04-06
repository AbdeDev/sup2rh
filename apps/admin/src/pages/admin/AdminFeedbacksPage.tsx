import { useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  Loader2,
  Mail,
  Calendar,
  CalendarRange as CalendarRangeIcon,
  Star,
  Search,
  TrendingUp,
} from "lucide-react";

import { getFeedbacks, type FeedbackItem } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { AdminDashboard } from "./AdminDashboard";

export function AdminFeedbacksPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) => f.email.toLowerCase().includes(q) || f.message.toLowerCase().includes(q),
      );
    }
    if (dateFrom || dateTo) {
      const fromTime = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : 0;
      const toTime = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Number.MAX_SAFE_INTEGER;
      result = result.filter((f) => {
        const t = new Date(f.createdAt).getTime();
        return t >= fromTime && t <= toTime;
      });
    }
    return result;
  }, [items, dateFrom, dateTo, search]);

  const avgRating = useMemo(() => {
    const rated = items.filter((f) => f.rating != null);
    if (rated.length === 0) return null;
    return (rated.reduce((acc, f) => acc + (f.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [items]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { items: data } = await getFeedbacks();
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
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#008c54]/10 border border-[#008c54]/20 text-[#008c54] text-[10px] font-semibold mb-2">
                <MessageSquare className="h-3 w-3" />
                Avis
              </div>
              <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">
                Avis utilisateurs
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length === items.length
                  ? `${items.length} avis au total`
                  : `${filteredItems.length} sur ${items.length} avis`}
              </p>
            </div>
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

          {/* Stats */}
          {!loading && items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                <p className="text-2xl font-bold text-foreground">{items.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Avis
                </p>
              </div>
              {avgRating && (
                <div className="rounded-xl border border-orange/20 bg-orange/5 p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Star className="h-4 w-4 fill-orange text-orange" />
                    <p className="text-2xl font-bold text-orange">{avgRating}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Note moyenne
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-success/20 bg-success/5 p-3.5 text-center">
                <TrendingUp className="h-4 w-4 text-success mx-auto mb-1" />
                <p className="text-lg font-bold text-success">
                  {items.filter((f) => (f.rating ?? 0) >= 4).length}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Avis positifs
                </p>
              </div>
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

          {items.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les avis…"
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
            <p className="text-xs text-muted-foreground">Chargement des avis…</p>
          </div>
        ) : items.length === 0 ? (
          <Card className="border border-border rounded-2xl">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">Aucun avis</p>
              <p className="text-xs text-muted-foreground">
                Les retours utilisateurs apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((f, idx) => (
              <Card
                key={f.id}
                className="border border-border rounded-2xl hover:border-primary/20 hover:shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-foreground block truncate">
                          {f.email}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {formatDate(f.createdAt)}
                        </div>
                      </div>
                    </div>
                    {f.rating != null && (
                      <div className="flex items-center gap-0.5 bg-muted/30 border border-border rounded-lg px-2 py-1 ml-10 sm:ml-0 w-fit shrink-0">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                              i <= f.rating!
                                ? "fill-orange text-orange"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                        <span className="ml-1 sm:ml-1.5 text-[11px] sm:text-xs font-medium text-foreground">
                          {f.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-0 sm:ml-10.5 sm:pl-0.5">
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {f.message}
                    </p>
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
