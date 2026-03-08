import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Phone,
  Mail,
  MessageSquare,
  Inbox,
  Search,
  GraduationCap,
  RefreshCw,
  CalendarDays,
  Copy,
  Check,
} from "lucide-react";

import { getCompanyContacts, type CompanyContactItem } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AdminDashboard } from "./AdminDashboard";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copier"
      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function AdminCompanyContactsPage() {
  const [items, setItems] = useState<CompanyContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { items: data } = await getCompanyContacts();
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));
  }

  function isNew(s: string) {
    const diff = Date.now() - new Date(s).getTime();
    return diff < 48 * 3600 * 1000;
  }

  const filtered = search.trim()
    ? items.filter(
        (i) =>
          i.companyName.toLowerCase().includes(search.toLowerCase()) ||
          i.email.toLowerCase().includes(search.toLowerCase()) ||
          i.contactName.toLowerCase().includes(search.toLowerCase()) ||
          (i.formationInterest ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Demandes entreprises
            </h1>
            <p className="text-xs text-muted-foreground">
              {filtered.length === items.length
                ? `${items.length} demande${items.length !== 1 ? "s" : ""} reçue${items.length !== 1 ? "s" : ""}`
                : `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} sur ${items.length}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs rounded-lg gap-1.5"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* Recherche */}
        {items.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par entreprise, email, contact, formation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm pl-9 border-border"
            />
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Chargement des demandes…</p>
          </div>
        ) : items.length === 0 ? (
          <Card className="border border-border rounded-2xl">
            <CardContent className="p-14 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">
                Aucune demande pour l'instant
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Les demandes des entreprises souhaitant recruter un alternant apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border border-border rounded-2xl">
            <CardContent className="p-12 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Aucun résultat</p>
              <p className="text-xs text-muted-foreground">Essayez d'autres mots-clés.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, idx) => (
              <Card
                key={item.id}
                className="border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all duration-200"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Ligne 1 : Entreprise + badge + date */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-foreground">{item.companyName}</p>
                          {isNew(item.createdAt) && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full font-semibold">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ligne 2 : Infos contact */}
                  <div className="bg-muted/30 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground">Contact</p>
                        <p className="text-xs font-medium text-foreground truncate">
                          {item.contactName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${item.email}`}
                          className="text-xs font-medium text-primary hover:underline truncate block"
                        >
                          {item.email}
                        </a>
                      </div>
                      <CopyButton text={item.email} />
                    </div>
                    {item.phone && (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground">Téléphone</p>
                          <a
                            href={`tel:${item.phone}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {item.phone}
                          </a>
                        </div>
                        <CopyButton text={item.phone} />
                      </div>
                    )}
                    {item.formationInterest && (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground">Formation souhaitée</p>
                          <p className="text-xs font-medium text-foreground">
                            {item.formationInterest}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ligne 3 : Message */}
                  <div className="rounded-xl border border-border bg-muted/10 px-3.5 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Message
                      </span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>

                  {/* Actions rapides */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`mailto:${item.email}?subject=Votre demande de recrutement SUP des RH`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Répondre par email
                    </a>
                    {item.phone && (
                      <>
                        <span className="text-border">·</span>
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Appeler
                        </a>
                      </>
                    )}
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
