import { useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  Loader2,
  Mail,
  Calendar,
  CalendarRange as CalendarRangeIcon,
  Star,
} from "lucide-react";

import { getFeedbacks, type FeedbackItem } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { AdminDashboard } from "./AdminDashboard";

export function AdminFeedbacksPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    return items.filter((f) => {
      const t = new Date(f.createdAt).getTime();
      return t >= fromTime && t <= toTime;
    });
  }, [items, dateFrom, dateTo]);

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
          <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-1">
                Avis utilisateurs
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredItems.length === items.length
                  ? "Retours laissés par les utilisateurs"
                  : `${filteredItems.length} sur ${items.length} avis`}
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
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Aucun avis pour l&apos;instant</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((f) => (
              <Card key={f.id} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="font-medium text-foreground text-sm">{f.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(f.createdAt)}
                    {f.rating != null && (
                      <span className="flex items-center gap-0.5 ml-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i <= f.rating! ? "fill-orange text-orange" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className="ml-1">({f.rating}/5)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{f.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminDashboard>
  );
}
