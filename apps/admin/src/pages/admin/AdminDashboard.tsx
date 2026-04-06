import { useNavigate, useLocation } from "react-router-dom";
import {
  Briefcase,
  FileQuestion,
  Users,
  LogOut,
  User,
  Mail,
  MessageSquare,
  Building2,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  LifeBuoy,
  FileText,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { supabase } from "../../lib/supabase";
import { clearAdminToken } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { AppLogo } from "../../components/AppLogo";

export function AdminDashboard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = useMemo(
    () => [
      { id: "jobs", label: t("nav.jobs"), icon: Briefcase, path: "/admin/jobs" },
      {
        id: "job-categories",
        label: t("nav.categories"),
        icon: LayoutGrid,
        path: "/admin/job-categories",
      },
      { id: "quizzes", label: t("nav.quizzes"), icon: FileQuestion, path: "/admin/quizzes" },
      { id: "users", label: t("nav.users"), icon: Users, path: "/admin/users" },
      {
        id: "contact-requests",
        label: t("nav.contacts"),
        icon: Mail,
        path: "/admin/contact-requests",
      },
      {
        id: "company-contacts",
        label: t("nav.companies"),
        icon: Building2,
        path: "/admin/company-contacts",
      },
      { id: "feedbacks", label: t("nav.feedbacks"), icon: MessageSquare, path: "/admin/feedbacks" },
      { id: "support", label: t("nav.support"), icon: LifeBuoy, path: "/admin/support" },
      { id: "brochures", label: t("nav.brochures"), icon: FileText, path: "/admin/brochures" },
    ],
    [t],
  );

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
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                {t("dashboard.title")}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                Admin
              </span>
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
            <LanguageSwitcher />
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
                    {t("nav.profile")}
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors rounded-lg mx-0.5"
                    style={{ width: "calc(100% - 4px)" }}
                    onClick={logout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t("nav.logout")}
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

        {/* Mobile bottom nav — scrollable horizontally */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md z-40 safe-area-pb">
          <nav className="flex items-center overflow-x-auto hide-scrollbar px-2 py-1.5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200 shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
                  }`}
                >
                  <div
                    className={`p-1 rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="whitespace-nowrap text-[9px]">{item.label}</span>
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
