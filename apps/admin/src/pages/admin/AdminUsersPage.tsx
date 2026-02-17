import { useEffect, useState } from "react";
import { Shield, ShieldCheck, Loader2, Users, Mail, Calendar } from "lucide-react";

import { getUsers, updateUserRole, type AdminUser } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { AdminDashboard } from "./AdminDashboard";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const { items } = await getUsers();
      setUsers(items);
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
      await loadUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la mise à jour");
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

  return (
    <AdminDashboard>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-1">
            Utilisateurs
          </h1>
          <p className="text-xs text-muted-foreground">
            Gère les rôles des utilisateurs (Admin/User)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 animate-in fade-in duration-300">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <Card className="border border-border bg-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun utilisateur</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user, index) => (
              <Card
                key={user.id}
                className="border border-border bg-card hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {user.role === "ADMIN" ? (
                          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            user.role === "ADMIN" ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-border text-muted-foreground hover:text-foreground transition-all duration-200"
                    onClick={() => handleToggleRole(user)}
                    disabled={updating === user.id}
                  >
                    {updating === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminDashboard>
  );
}
