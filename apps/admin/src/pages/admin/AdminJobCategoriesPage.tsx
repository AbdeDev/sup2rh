import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Loader2, LayoutGrid, X, Check } from "lucide-react";

import {
  getJobCategories,
  createJobCategory,
  updateJobCategory,
  deleteJobCategory,
  type JobCategory,
} from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AdminDashboard } from "./AdminDashboard";

const STATUS_LABELS: Record<string, string> = {
  established: "Établi",
  emerging: "Émergent",
};

const STATUS_COLORS: Record<string, string> = {
  established:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40",
  emerging:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40",
};

const STATUS_HEADER_COLORS: Record<string, string> = {
  established:
    "bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border-b border-emerald-200/50 dark:from-emerald-500/10 dark:to-emerald-600/5 dark:border-emerald-800/30",
  emerging:
    "bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-b border-amber-200/50 dark:from-amber-500/10 dark:to-amber-600/5 dark:border-amber-800/30",
};

interface FormState {
  name: string;
  emoji: string;
  description: string;
  status: "established" | "emerging" | "";
  position: string;
}

const EMPTY_FORM: FormState = { name: "", emoji: "", description: "", status: "", position: "" };

export function AdminJobCategoriesPage() {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal état
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JobCategory | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Edition inline d'emoji ou de position
  const [inlineEdit, setInlineEdit] = useState<{
    id: string;
    field: "emoji" | "position";
    value: string;
  } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { items } = await getJobCategories();
      setCategories(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(cat: JobCategory) {
    setEditing(cat);
    setForm({
      name: cat.name,
      emoji: cat.emoji ?? "",
      description: cat.description ?? "",
      status: (cat.status as "established" | "emerging") ?? "",
      position: String(cat.position),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Le nom du domaine est requis");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        emoji: form.emoji.trim() || undefined,
        description: form.description.trim() || undefined,
        status: (form.status || undefined) as "established" | "emerging" | undefined,
        position: form.position !== "" ? Number(form.position) : undefined,
      };
      if (editing) {
        await updateJobCategory(editing.id, payload);
        toast.success(`Domaine "${name}" mis à jour`);
      } else {
        await createJobCategory(payload);
        toast.success(`Domaine "${name}" créé`);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: JobCategory) {
    if (
      !confirm(
        `Supprimer le domaine "${cat.name}" ?\n\nLes fiches associées perdront cette catégorie. Cette action est irréversible.`,
      )
    )
      return;
    try {
      await deleteJobCategory(cat.id);
      toast.success(`Domaine "${cat.name}" supprimé`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
  }

  async function saveInline() {
    if (!inlineEdit) return;
    const cat = categories.find((c) => c.id === inlineEdit.id);
    if (!cat) return;
    try {
      await updateJobCategory(cat.id, {
        [inlineEdit.field]:
          inlineEdit.field === "position" ? Number(inlineEdit.value) : inlineEdit.value,
      });
      toast.success("Mis à jour");
      setInlineEdit(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <AdminDashboard>
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
              Grands domaines RH
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {categories.length} domaine{categories.length !== 1 ? "s" : ""} · Regroupent les
              fiches métier dans le résultat du quiz
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nouveau domaine
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">Aucun domaine créé</p>
              <p className="text-sm text-muted-foreground/70">
                Les 18 domaines SUP des RH seront créés automatiquement via la migration backend.
              </p>
              <Button onClick={openCreate} variant="outline" className="mt-2 gap-2">
                <Plus className="h-4 w-4" />
                Créer le premier domaine
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-5 items-start">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="flex flex-col border border-border bg-card rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <CardContent className="flex flex-col flex-1 p-0">
                  {/* En-tête coloré selon le statut */}
                  <div
                    className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 ${
                      cat.status
                        ? (STATUS_HEADER_COLORS[cat.status] ?? "bg-muted/30 border-b border-border")
                        : "bg-muted/30 border-b border-border"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setInlineEdit({ id: cat.id, field: "emoji", value: cat.emoji ?? "" })
                      }
                      className="h-10 w-10 rounded-xl bg-card/80 border border-border/60 flex items-center justify-center text-xl shrink-0 hover:bg-card hover:scale-105 transition-all duration-200 shadow-sm"
                      title="Cliquer pour modifier l'emoji"
                    >
                      {cat.emoji ?? "📁"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight truncate">
                        {cat.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {cat.status ? (
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[cat.status] ?? ""}`}
                          >
                            {STATUS_LABELS[cat.status] ?? cat.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground">
                            Non défini
                          </span>
                        )}
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border border-border/60 bg-card/60 text-muted-foreground">
                          #{cat.position}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloc modification emoji */}
                  {inlineEdit?.id === cat.id && inlineEdit.field === "emoji" && (
                    <div className="mx-4 my-3 p-3.5 rounded-xl border border-border bg-muted/30 space-y-2.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Modifier l&apos;emoji
                      </p>
                      <Input
                        autoFocus
                        value={inlineEdit.value}
                        onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                        className="h-10 text-center text-xl"
                        placeholder="ex: 📁"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveInline();
                          if (e.key === "Escape") setInlineEdit(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                          onClick={saveInline}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Valider
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 h-8 text-xs"
                          onClick={() => setInlineEdit(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="flex-1 px-4 sm:px-5 py-3">
                    {cat.description ? (
                      <div className="max-h-20 sm:max-h-24 overflow-y-auto rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-xs text-foreground/80 leading-relaxed break-words">
                        {cat.description}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/50 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground/50 italic text-center">
                        Aucune description
                      </div>
                    )}
                  </div>

                  {/* Pied : actions */}
                  <div className="flex items-center justify-end gap-1 px-3 sm:px-4 py-2.5 border-t border-border/50 bg-muted/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/80 rounded-lg"
                      onClick={() => openEdit(cat)}
                    >
                      <Edit2 className="h-3 w-3" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => handleDelete(cat)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Formulaire */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {editing ? `Modifier "${editing.name}"` : "Nouveau grand domaine RH"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Nom */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Nom du domaine <span className="text-destructive">*</span>
                  </label>
                  <Input
                    autoFocus
                    placeholder="ex: Recrutement & Acquisition de Talents"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                {/* Emoji */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Emoji</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="🎯"
                      value={form.emoji}
                      onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                      className="w-24 text-center text-xl"
                    />
                    <span className="text-sm text-muted-foreground">
                      Colle un emoji depuis ton clavier (⌘ + Ctrl + Espace sur Mac)
                    </span>
                  </div>
                </div>

                {/* Statut */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as "established" | "emerging" | "",
                      })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Non défini —</option>
                    <option value="established">Établi</option>
                    <option value="emerging">Émergent</option>
                  </select>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Description (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Description courte du domaine RH…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Position */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Ordre d'affichage</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-28"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Les domaines sont triés par ordre croissant.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? "Mettre à jour" : "Créer le domaine"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminDashboard>
  );
}
