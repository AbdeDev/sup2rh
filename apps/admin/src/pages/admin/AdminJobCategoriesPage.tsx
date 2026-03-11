import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Loader2, LayoutGrid, GripVertical, X, Check } from "lucide-react";

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
          <div className="grid gap-3">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="group transition-all hover:shadow-lg border-border overflow-hidden"
              >
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  {/* Bloc principal */}
                  <div className="flex flex-1 min-w-0 p-4 sm:p-5 gap-4">
                    <div className="flex flex-col gap-2 shrink-0">
                      <div
                        className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl cursor-pointer hover:bg-primary/15 transition-colors overflow-hidden"
                        title="Cliquer pour modifier l'emoji"
                        onClick={() =>
                          setInlineEdit({ id: cat.id, field: "emoji", value: cat.emoji ?? "" })
                        }
                      >
                        <span className="block" title={cat.emoji ?? "📁"}>
                          {cat.emoji ?? "📁"}
                        </span>
                      </div>
                      {inlineEdit?.id === cat.id && inlineEdit.field === "emoji" && (
                        <div className="flex flex-col gap-1.5 p-2 rounded-lg border border-border bg-muted/30 min-w-[140px]">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Nouvel emoji
                          </label>
                          <div className="flex gap-1.5 items-center">
                            <Input
                              autoFocus
                              value={inlineEdit.value}
                              onChange={(e) =>
                                setInlineEdit({ ...inlineEdit, value: e.target.value })
                              }
                              className="h-8 flex-1 min-w-0 text-center text-base"
                              placeholder="ex: 📁"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveInline();
                                if (e.key === "Escape") setInlineEdit(null);
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                              onClick={saveInline}
                              title="Valider"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                              onClick={() => setInlineEdit(null)}
                              title="Annuler"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="font-semibold text-foreground text-base break-words"
                          title={cat.name}
                        >
                          {cat.name}
                        </span>
                        {cat.status && (
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[cat.status] ?? ""}`}
                          >
                            {STATUS_LABELS[cat.status] ?? cat.status}
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p
                          className="text-sm text-muted-foreground mt-1.5 break-words overflow-hidden"
                          title={cat.description}
                        >
                          {cat.description}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground/70 mt-2 shrink-0">
                        Ordre : {cat.position}
                      </p>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      Ordre : {cat.position} · ID : <code className="font-mono">{cat.id}</code>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(cat)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(cat)}
                    >
                      <Trash2 className="h-4 w-4" />
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
