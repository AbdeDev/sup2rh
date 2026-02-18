import { useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase,
  FileQuestion,
  Users,
  LogOut,
  User,
  Sparkles,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { supabase } from "../../lib/supabase";
import { clearAdminToken } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ThemeToggle";
//import { Separator } from "../../components/ui/separator";

const navItems = [
  { id: "jobs", label: "Fiches métier", icon: Briefcase, path: "/admin/jobs" },
  { id: "quizzes", label: "Quiz", icon: FileQuestion, path: "/admin/quizzes" },
  { id: "users", label: "Utilisateurs", icon: Users, path: "/admin/users" },
  {
    id: "contact-requests",
    label: "Demandes de contact",
    icon: Mail,
    path: "/admin/contact-requests",
  },
  { id: "feedbacks", label: "Avis utilisateurs", icon: MessageSquare, path: "/admin/feedbacks" },
];

export function AdminDashboard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-4 lg:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">Admin Sup2RH</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <User className="h-4 w-4" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-border bg-card py-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors duration-150"
                    onClick={() => {
                      setUserMenuOpen(false);
                    }}
                  >
                    <User className="h-3.5 w-3.5" />
                    Profil
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
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
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-border bg-card/50 hidden md:block">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur z-40">
          <nav className="flex items-center justify-around p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md text-[10px] transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
