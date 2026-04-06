import { useEffect, useState } from "react";
import { FileText, Loader2, Plus, Pencil, Trash2, Inbox, X, Save } from "lucide-react";

import { request } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { AdminDashboard } from "./AdminDashboard";

interface BrochureItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

async function getBrochures(): Promise<{ items: BrochureItem[] }> {
  return request<{ items: BrochureItem[] }>("/admin/brochures");
}

export function AdminBrochuresPage() {
  const [items, setItems] = useState<BrochureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { items: data } = await getBrochures();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formName.trim() || !formContent.trim()) return;
    setSaving(true);
    try {
      const created = await request<BrochureItem>("/admin/brochures", {
        method: "POST",
        body: JSON.stringify({ name: formName.trim(), content: formContent.trim() }),
      });
      setItems((prev) => [created, ...prev]);
      setShowCreate(false);
      setFormName("");
      setFormContent("");
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!formName.trim() || !formContent.trim()) return;
    setSaving(true);
    try {
      const updated = await request<BrochureItem>(`/admin/brochures/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: formName.trim(), content: formContent.trim() }),
      });
      setItems((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setEditId(null);
      setFormName("");
      setFormContent("");
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette brochure ?")) return;
    try {
      await request(`/admin/brochures/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((b) => b.id !== id));
    } catch {
      // ignore
    }
  }

  function startEdit(b: BrochureItem) {
    setEditId(b.id);
    setFormName(b.name);
    setFormContent(b.content);
    setShowCreate(false);
  }

  function cancelForm() {
    setEditId(null);
    setShowCreate(false);
    setFormName("");
    setFormContent("");
  }

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Brochures IA
            </h1>
            <p className="text-xs text-muted-foreground">
              Contenu injecté dans le prompt de l'IA pour enrichir les analyses
            </p>
          </div>
          <Button
            size="sm"
            className="h-9 text-xs rounded-lg gap-1.5"
            onClick={() => {
              setShowCreate(true);
              setEditId(null);
              setFormName("");
              setFormContent("");
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs">
            {error}
          </div>
        )}

        {(showCreate || editId) && (
          <Card className="border border-primary/30 rounded-2xl mb-5 animate-in fade-in duration-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {editId ? "Modifier la brochure" : "Nouvelle brochure"}
                </h3>
                <button
                  onClick={cancelForm}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nom de la brochure"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <textarea
                placeholder="Contenu textuel (informations sur les formations, le programme, etc.)"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
              />
              <Button
                size="sm"
                className="h-9 text-xs rounded-lg gap-1.5"
                disabled={saving || !formName.trim() || !formContent.trim()}
                onClick={() => (editId ? handleUpdate(editId) : handleCreate())}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {editId ? "Mettre à jour" : "Créer"}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card className="border border-border rounded-2xl">
            <CardContent className="p-12 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">Aucune brochure</p>
              <p className="text-xs text-muted-foreground">
                Ajoutez du contenu pour enrichir les analyses IA
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((b, idx) => (
              <Card
                key={b.id}
                className="border border-border rounded-2xl hover:border-primary/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(b)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {b.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                    {new Date(b.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminDashboard>
  );
}
