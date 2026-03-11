import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, ChevronLeft } from "lucide-react";
import { LoginForm } from "../components/login-form";
import { AppLogo } from "../components/AppLogo";
import { ThemeToggle } from "../components/ThemeToggle";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  if (fromPath && fromPath !== "/login") {
    sessionStorage.setItem("redirectAfterLogin", fromPath);
  }

  const fromResult =
    typeof window !== "undefined" &&
    sessionStorage.getItem("redirectAfterLogin")?.startsWith("/result");

  return (
    <div className="h-screen w-full bg-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Bouton retour accueil */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50">
        <a
          href="rhetmoi-supdesrh.fr"
          className="inline-flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:px-4 md:py-2 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          title="Retour à l'accueil"
        >
          <ChevronLeft className="h-5 w-5 md:mr-1.5" />
          <span className="hidden md:inline">Retour a l'accueil</span>
        </a>
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Colonne Gauche : Marque & Proposition de valeur (cachée sur mobile/tablette, visible à partir de lg) */}
      <div className="hidden lg:flex flex-col justify-center w-[45%] max-w-[600px] bg-muted/20 dark:bg-muted/10 border-r border-border relative p-10 xl:p-16 overflow-hidden">
        {/* Fond décoratif gauche */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#004080]/[0.08] dark:bg-[#004080]/[0.12] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#008c54]/[0.06] dark:bg-[#008c54]/[0.1] blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <div className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-card shadow-md border border-border/60 flex items-center justify-center">
              <AppLogo className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">
              RH et moi <span className="font-normal text-muted-foreground">by</span> SUP des RH
            </span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20 w-fit">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              100% Gratuit
            </div>
            <h1 className="text-4xl xl:text-5xl font-heading font-extrabold text-foreground leading-[1.15] tracking-tight">
              Trouve le{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004080] to-[#008c54] dark:from-[#38bdf8] dark:to-[#4ade80]">
                métier RH
              </span>
              <br />
              qui te ressemble
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-[420px]">
              Crée ton espace personnel pour sauvegarder tes résultats de quiz et explorer les
              fiches métiers.
            </p>
          </div>

          <div className="pt-6 border-t border-border/60 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="h-10 w-10 rounded-full border-2 border-muted bg-[#004080] flex items-center justify-center text-xs font-bold text-white">
                A
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-muted bg-[#008c54] flex items-center justify-center text-xs font-bold text-white">
                M
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-muted bg-[#f37021] flex items-center justify-center text-xs font-bold text-white">
                L
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              <strong className="text-foreground">+2 000 étudiants</strong> ont déjà trouvé leur
              voie
            </p>
          </div>
        </div>
      </div>

      {/* Colonne Droite : Formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative h-full overflow-hidden">
        {/* Fond décoratif mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#004080]/[0.06] dark:bg-[#004080]/[0.1] blur-[80px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#008c54]/[0.05] dark:bg-[#008c54]/[0.08] blur-[80px]" />
        </div>

        <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 flex flex-col gap-3 my-auto min-w-0">
          {/* En-tête (Mobile uniquement) */}
          <div className="lg:hidden text-center flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-card shadow-md border border-border/60 flex items-center justify-center">
              <AppLogo className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">Connexion</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sauvegarde tes résultats et explore les métiers.
              </p>
            </div>
          </div>

          {/* En-tête (Desktop uniquement) */}
          <div className="hidden lg:block text-center mb-2">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Bienvenue 👋</h2>
            <p className="text-sm text-muted-foreground">
              Connecte-toi pour accéder à ton espace personnel.
            </p>
            <p className="text-xs text-muted-foreground">
              Pas besoin de mot de passe, juste ton e‑mail pour recevoir un lien de connexion
              securisé.
            </p>
          </div>

          {fromResult && (
            <div className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Connecte-toi pour voir ton résultat
            </div>
          )}

          {/* Le formulaire */}
          <div className="rounded-3xl border border-border/70 bg-card/95 dark:bg-card/90 backdrop-blur-md shadow-xl shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
            <div className="p-0">
              <LoginForm className="[&>div]:border-none [&>div]:bg-transparent [&>div]:shadow-none [&_p.text-center]:hidden" />
            </div>
          </div>

          {/* Bloc confidentialité compact */}
          <div className="rounded-2xl border border-[#008c54]/30 bg-[#008c54]/[0.04] dark:bg-[#008c54]/[0.08] p-3 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <ShieldCheck
                className="h-5 w-5 text-[#008c54] dark:text-[#22c55e]"
                strokeWidth={2.5}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-foreground leading-snug mb-0.5">
                Ton e‑mail n&apos;est jamais utilisé à des fins commerciales
              </p>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Il sert uniquement à t&apos;envoyer ton lien de connexion sécurisé. Aucun spam.
              </p>
              <p className="text-[11px] leading-tight text-muted-foreground">
                il n'est jamais partagé avec des tiers et n'est utilisé que si tu fais explicitement
                la demande d'être contacté par Sup des RH.
              </p>
            </div>
          </div>

          <div className="text-center mt-1">
            <button
              type="button"
              onClick={() => navigate("/fiches")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Voir les fiches métiers sans connexion
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
              En continuant, tu acceptes nos{" "}
              <a href="/legal/conditions" className="underline hover:text-foreground">
                CGU
              </a>{" "}
              et notre{" "}
              <a href="/legal/confidentialite" className="underline hover:text-foreground">
                Politique de confidentialité
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
