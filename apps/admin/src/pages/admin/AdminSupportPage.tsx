import { useEffect, useState, useMemo } from "react";
import {
  HelpCircle,
  Lightbulb,
  Loader2,
  Inbox,
  Search,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AdminDashboard } from "./AdminDashboard";
import { request } from "../../lib/api";

interface SupportTicketItem {
  id: string;
  userId: string | null;
  email: string;
  type: "support" | "feature_request";
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  createdAt: string;
}

async function getSupportTickets(): Promise<{ items: SupportTicketItem[] }> {
  return request<{ items: SupportTicketItem[] }>("/admin/support");
}

async function updateTicketStatus(id: string, status: string): Promise<void> {
  await request(`/admin/support/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

const STATUS_CONFIG = {
  open: {
    label: "Ouvert",
    icon: AlertCircle,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  in_progress: {
    label: "En cours",
    icon: Clock,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  closed: {
    label: "Fermé",
    icon: CheckCircle2,
    color: "text-green-500 bg-green-500/10 border-green-500/20",
  },
} as const;

export function AdminSupportPage() {
  const [items, setItems] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "support" | "feature_request">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "closed">(
    "all",
  );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { items: data } = await getSupportTickets();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = items;
    if (filterType !== "all") result = result.filter((t) => t.type === filterType);
    if (filterStatus !== "all") result = result.filter((t) => t.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.email.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, filterType, filterStatus, search]);

  function formatDate(s: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateTicketStatus(id, status);
      setItems((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: status as SupportTicketItem["status"] } : t,
        ),
      );
    } catch {
      // Ignore
    }
  }

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">
            Support & Suggestions
          </h1>
          <p className="text-xs text-muted-foreground">
            {items.length} ticket{items.length !== 1 ? "s" : ""} au total
            {items.filter((t) => t.status === "open").length > 0 &&
              ` · ${items.filter((t) => t.status === "open").length} ouvert(s)`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {(["all", "support", "feature_request"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 transition-colors ${filterType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "all" ? "Tous" : t === "support" ? "Aide" : "Suggestions"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {(["all", "open", "in_progress", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {items.length > 3 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm pl-9 border-border"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border border-border rounded-2xl">
            <CardContent className="p-12 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">Aucun ticket</p>
              <p className="text-xs text-muted-foreground">
                Les demandes de support et suggestions apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket, idx) => {
              const cfg = STATUS_CONFIG[ticket.status];
              const StatusIcon = cfg.icon;
              return (
                <Card
                  key={ticket.id}
                  className="border border-border rounded-2xl hover:border-primary/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {ticket.type === "support" ? (
                            <HelpCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {ticket.subject}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              {ticket.email}
                            </span>
                            <span className="hidden sm:inline">·</span>
                            <span className="shrink-0">{formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ml-10 sm:ml-0 w-fit ${cfg.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 rounded-lg p-3">
                      {ticket.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {ticket.status !== "in_progress" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] rounded-lg"
                          onClick={() => handleStatusChange(ticket.id, "in_progress")}
                        >
                          En cours
                        </Button>
                      )}
                      {ticket.status !== "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] rounded-lg"
                          onClick={() => handleStatusChange(ticket.id, "closed")}
                        >
                          Fermer
                        </Button>
                      )}
                      {ticket.status === "closed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] rounded-lg"
                          onClick={() => handleStatusChange(ticket.id, "open")}
                        >
                          Rouvrir
                        </Button>
                      )}
                      <a
                        href={`mailto:${ticket.email}?subject=Re: ${ticket.subject}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline sm:ml-auto"
                      >
                        <Mail className="h-3 w-3" />
                        Répondre
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminDashboard>
  );
}
