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
  established: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  emerging: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="flex flex-col border border-border bg-card rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardContent className="flex flex-col flex-1 p-0">
                  {/* En-tête : emoji + nom + statut */}
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <button
                      type="button"
                      onClick={() =>
                        setInlineEdit({ id: cat.id, field: "emoji", value: cat.emoji ?? "" })
                      }
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl sm:text-3xl shrink-0 hover:bg-primary/15 transition-colors"
                      title="Cliquer pour modifier l'emoji"
                    >
                      {cat.emoji ?? "📁"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base sm:text-lg leading-tight break-words">
                        {cat.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {cat.status && (
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[cat.status] ?? ""}`}
                          >
                            {STATUS_LABELS[cat.status] ?? cat.status}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Ordre · {cat.position}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloc modification emoji (s’affiche sous l’en-tête) */}
                  {inlineEdit?.id === cat.id && inlineEdit.field === "emoji" && (
                    <div className="mx-4 mb-4 p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                          className="flex-1 gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/50"
                          onClick={saveInline}
                        >
                          <Check className="h-4 w-4" />
                          Valider
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => setInlineEdit(null)}
                        >
                          <X className="h-4 w-4" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Description : zone lisible avec scroll */}
                  {cat.description && (
                    <div className="px-4 sm:px-5 pb-3">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                        Description
                      </p>
                      <div className="max-h-24 sm:max-h-28 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm text-foreground/90 leading-relaxed break-words">
                        {cat.description}
                      </div>
                    </div>
                  )}

                  {/* Pied : actions toujours visibles */}
                  <div className="mt-auto flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border bg-muted/10">
                    <span className="text-xs text-muted-foreground">
                      Ordre d&apos;affichage : {cat.position}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => openEdit(cat)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
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
