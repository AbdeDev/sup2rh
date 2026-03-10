import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

import { AppLogo } from "../components/AppLogo";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";

export function LegalConditionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center gap-2.5 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            aria-label="Accueil"
          >
            <AppLogo className="h-9 w-9 object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-heading font-bold text-foreground leading-tight">
                Rh et moi by SUP des RH
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Mentions légales</p>
            </div>
          </button>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground mb-3"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Retour
            </Button>
          </div>

          <Card className="border border-border bg-card rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6 md:p-8 space-y-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-heading font-bold text-foreground">
                    Conditions d&apos;utilisation
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    Rh et moi by SUP des RH &middot; Lamascott
                  </p>
                </div>
              </div>

              <p>
                Ces conditions d&apos;utilisation encadrent l&apos;accès et l&apos;utilisation de
                l&apos;outil d&apos;orientation en ligne proposé par Sup des RH (&quot;le
                service&quot;). En utilisant le service, tu acceptes ces conditions.
              </p>

              {[
                {
                  title: "1. Objet du service",
                  content:
                    "Le service Rh et moi by SUP des RH a pour objectif de t'aider à découvrir les métiers des Ressources Humaines qui te correspondent le mieux, à travers un quiz court et personnalisé et des fiches métiers pédagogiques. Il s'agit d'un outil d'orientation et de réflexion, sans valeur contractuelle ni engagement d'admission.",
                },
                {
                  title: "2. Création de compte",
                  content:
                    "Pour sauvegarder tes résultats et retrouver tes sessions de quiz, tu dois créer un compte en renseignant ton adresse e‑mail. Tu t'engages à fournir une adresse valide et à ne pas usurper l'identité d'une autre personne.",
                },
                {
                  title: "3. Utilisation raisonnable",
                  content:
                    "Tu t'engages à utiliser le service de manière raisonnable, à ne pas tenter de perturber son fonctionnement (spam, attaque, collecte automatisée de données, etc.) et à ne pas l'utiliser à des fins contraires à la loi ou à l'image de Sup des RH.",
                },
                {
                  title: "4. Résultats du quiz",
                  content:
                    "Les résultats proposés par Lamascott reposent sur tes réponses et sur des règles d'orientation internes (liens question ↔ fiche métier). Ils constituent une aide à la réflexion et ne constituent ni un diagnostic psychologique ni une promesse d'emploi ou d'admission en formation.",
                },
                {
                  title: "5. Données et sécurité",
                  content:
                    "Le fonctionnement du service suppose la collecte et le traitement de certaines données personnelles (voir la Politique de confidentialité). Sup des RH met en œuvre des mesures raisonnables pour protéger ces données, mais ne peut garantir une sécurité absolue sur Internet.",
                },
                {
                  title: "6. Suspension du service",
                  content:
                    "Sup des RH se réserve le droit de modifier, suspendre ou interrompre le service à tout moment, notamment en cas de maintenance technique, d'évolution pédagogique ou de problème de sécurité.",
                },
                {
                  title: "7. Propriété intellectuelle",
                  content:
                    "Le service et son contenu sont protégés par le droit d'auteur. La redistribution du code source est strictement interdite. L'utilisation des artefacts de déploiement est soumise à la licence de distribution applicable (voir DISTRIBUTION_LICENSE).",
                },
                {
                  title: "8. Contact et réclamation",
                  content:
                    "Pour toute question sur ces conditions ou sur le fonctionnement de l'outil, tu peux contacter directement l'équipe Sup des RH via le site officiel de l'école ou les coordonnées fournies dans l'app.",
                },
              ].map((section) => (
                <div key={section.title}>
                  <h2 className="font-heading font-bold text-foreground text-sm mb-1.5">
                    {section.title}
                  </h2>
                  <p className="leading-relaxed">{section.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
