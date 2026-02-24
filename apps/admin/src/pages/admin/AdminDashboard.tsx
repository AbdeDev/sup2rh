import { useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase,
  FileQuestion,
  Users,
  LogOut,
  User,
  Mail,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { supabase } from "../../lib/supabase";
import { clearAdminToken } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { AppLogo } from "../../components/AppLogo";

const navItems = [
  { id: "jobs", label: "Fiches métier", icon: Briefcase, path: "/admin/jobs" },
  { id: "quizzes", label: "Quiz", icon: FileQuestion, path: "/admin/quizzes" },
  { id: "users", label: "Utilisateurs", icon: Users, path: "/admin/users" },
  { id: "contact-requests", label: "Demandes", icon: Mail, path: "/admin/contact-requests" },
  { id: "feedbacks", label: "Avis", icon: MessageSquare, path: "/admin/feedbacks" },
];

export function AdminDashboard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userMenuOpen]);

  async function logout() {
    clearAdminToken();
    await supabase.auth.signOut();
    navigate("/login");
  }

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/admin/jobs")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
          >
            <AppLogo className="h-9 w-9 shrink-0 object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                SupdesRH
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Administration</p>
            </div>
          </button>

          {/* Desktop toggle sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:flex text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarCollapsed((c) => !c)}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <User className="h-4 w-4" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-card py-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors rounded-lg mx-0.5"
                    style={{ width: "calc(100% - 4px)" }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Mon profil
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors rounded-lg mx-0.5"
                    style={{ width: "calc(100% - 4px)" }}
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <aside
          className={`shrink-0 border-r border-border bg-card/50 hidden md:flex flex-col transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "w-[60px]" : "w-56"
          }`}
        >
          <nav className="flex-1 p-2.5 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-40 safe-area-pb">
          <nav className="flex items-center justify-around px-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200 min-w-0 ${
                    isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
                  }`}
                >
                  <div
                    className={`p-1 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="truncate max-w-[56px]">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
