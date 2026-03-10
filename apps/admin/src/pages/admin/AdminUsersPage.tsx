import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  Loader2,
  Users,
  Mail,
  Calendar,
  ClipboardList,
  Trophy,
  Clock,
  X,
  Search,
  BarChart3,
} from "lucide-react";

import {
  getUsers,
  getAdminSessions,
  updateUserRole,
  type AdminUser,
  type AdminUserSession,
} from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { SessionResultModal } from "../../components/SessionResultModal";
import { AdminDashboard } from "./AdminDashboard";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessionsByUser, setSessionsByUser] = useState<Record<string, AdminUserSession>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [popupUser, setPopupUser] = useState<AdminUser | null>(null);
  const [resultSessionId, setResultSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, sessionsRes] = await Promise.all([getUsers(), getAdminSessions()]);
      setUsers(usersRes.items);
      const map: Record<string, AdminUserSession> = {};
      sessionsRes.items.forEach((s) => {
        map[s.userId] = s;
      });
      setSessionsByUser(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRole(user: AdminUser) {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    if (
      !confirm(
        `Es-tu sûr de vouloir ${newRole === "ADMIN" ? "donner" : "retirer"} le rôle admin à ${user.email} ?`,
      )
    )
      return;

    setUpdating(user.id);
    try {
      await updateUserRole(user.id, newRole);
      await loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la mise à jour");
    } finally {
      setUpdating(null);
    }
  }

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  }

  function formatFullDate(dateString: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  function getLastActivity(user: AdminUser): string | null {
    const sessions = sessionsByUser[user.id];
    if (!sessions || !sessions.sessions || sessions.sessions.length === 0) return null;
    return sessions.sessions.reduce<string | null>((latest, s) => {
      if (!latest) return s.createdAt;
      return new Date(s.createdAt) > new Date(latest) ? s.createdAt : latest;
    }, null);
  }

  const filteredUsers = users
    .filter((u) => {
      if (roleFilter === "ALL") return true;
      return u.role === roleFilter;
    })
    .filter((u) => (search.trim() ? u.email.toLowerCase().includes(search.toLowerCase()) : true))
    // option : les plus récents en premier
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const userSessions = popupUser ? sessionsByUser[popupUser.id] : null;
  const totalSessions = Object.values(sessionsByUser).reduce((acc, s) => acc + s.sessionCount, 0);
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header + stats */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-1">
            Utilisateurs
          </h1>
          <p className="text-xs text-muted-foreground mb-5">
            Gère les rôles et consulte les quiz réalisés par chaque utilisateur
          </p>

          {!loading && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Utilisateurs
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-center">
                <p className="text-2xl font-bold text-primary">{adminCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Admins
                </p>
              </div>
              <div className="rounded-xl border border-success/20 bg-success/5 p-3.5 text-center">
                <p className="text-2xl font-bold text-success">{totalSessions}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Quiz total
                </p>
              </div>
            </div>
          )}

          {users.length > 4 && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm pl-9 border-border"
              />
            </div>
          )}

          {users.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
              <span className="uppercase tracking-wider">Filtrer par rôle :</span>
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                  roleFilter === "ALL"
                    ? "border-primary/60 text-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("ADMIN")}
                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                  roleFilter === "ADMIN"
                    ? "border-primary/60 text-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("USER")}
                className={`px-2 py-0.5 rounded-full border text-[11px] ${
                  roleFilter === "USER"
                    ? "border-primary/60 text-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Utilisateur
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="h-7 text-xs shrink-0 ml-3"
            >
              Réessayer
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 animate-in fade-in duration-300">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Chargement des utilisateurs…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border border-border bg-card animate-in fade-in duration-500">
            <CardContent className="p-10 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "Aucun résultat pour cette recherche" : "Aucun utilisateur"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user, index) => {
              const sessions = sessionsByUser[user.id];
              const quizCount = sessions?.sessionCount ?? 0;
              const lastActivity = getLastActivity(user);
              return (
                <Card
                  key={user.id}
                  className="group border border-border bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <CardContent className="p-0">
                    {/* Role banner */}
                    <div
                      className={`px-4 py-2 flex items-center gap-2 ${
                        user.role === "ADMIN"
                          ? "bg-primary/10 border-b border-primary/15"
                          : "bg-muted/30 border-b border-border"
                      }`}
                    >
                      {user.role === "ADMIN" ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span
                        className={`text-[11px] font-semibold ${
                          user.role === "ADMIN" ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </span>
                        {lastActivity && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernière activité&nbsp;: {formatFullDate(lastActivity)}
                          </span>
                        )}
                        {quizCount > 0 && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <ClipboardList className="h-3 w-3" />
                            {quizCount} quiz
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {quizCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs rounded-lg border-border hover:border-primary/40 hover:text-primary transition-colors"
                            onClick={() => setPopupUser(user)}
                          >
                            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                            Quiz
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 text-xs rounded-lg border-border transition-colors ${
                            quizCount === 0 ? "flex-1" : ""
                          }`}
                          onClick={() => handleToggleRole(user)}
                          disabled={updating === user.id}
                        >
                          {updating === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : user.role === "ADMIN" ? (
                            <>
                              <Shield className="h-3.5 w-3.5 mr-1.5" />
                              Retirer admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                              Donner admin
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Popup quiz utilisateur */}
      {popupUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setPopupUser(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in scale-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-semibold text-foreground">
                    Quiz de {popupUser.email}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {userSessions?.sessionCount ?? 0} quiz réalisé
                    {(userSessions?.sessionCount ?? 0) > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPopupUser(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {userSessions?.sessions.map((session) => (
                <div
                  key={session.id}
                  className="group rounded-xl border border-border bg-muted/10 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatFullDate(session.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.finalJobId ? (
                        <>
                          <Trophy className="h-3.5 w-3.5 text-success" />
                          <span className="font-medium text-foreground">
                            {session.jobName ?? session.finalJobId}
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-orange" />
                          <span className="text-muted-foreground">En cours</span>
                        </>
                      )}
                    </div>
                    <span className="text-muted-foreground">{session.answerCount} réponses</span>
                    <button
                      type="button"
                      onClick={() => setResultSessionId(session.id)}
                      className="ml-auto flex items-center gap-1.5 text-primary hover:underline font-medium"
                    >
                      <BarChart3 className="h-3 w-3" />
                      Voir le résultat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal résultat (reste dans admin) */}
      {resultSessionId && (
        <SessionResultModal sessionId={resultSessionId} onClose={() => setResultSessionId(null)} />
      )}
    </AdminDashboard>
  );
}
