import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

import { AppLogo } from "../components/AppLogo";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";

export function LegalPrivacyPage() {
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
                Quiz SUP des RH
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Confidentialité</p>
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
                <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h1 className="text-lg font-heading font-bold text-foreground">
                    Politique de confidentialité
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    Quiz SUP des RH &middot; Lamascott
                  </p>
                </div>
              </div>

              <p>
                Cette politique de confidentialité explique quelles données personnelles sont
                collectées lorsque tu utilises l&apos;outil d&apos;orientation Quiz SUP des RH
                (Lamascott), comment elles sont utilisées et quels sont tes droits.
              </p>

              <div>
                <h2 className="font-heading font-bold text-foreground text-sm mb-1.5">
                  1. Responsable du traitement
                </h2>
                <p className="leading-relaxed">
                  Le responsable du traitement des données est Sup des RH, établissement
                  d&apos;enseignement spécialisé dans les Ressources Humaines.
                </p>
              </div>

              <div>
                <h2 className="font-heading font-bold text-foreground text-sm mb-1.5">
                  2. Données collectées
                </h2>
                <p className="mb-2">Nous collectons principalement :</p>
                <ul className="list-none space-y-2">
                  {[
                    "Ton adresse e‑mail pour créer ton compte et t'envoyer le lien de connexion (magic link). Elle n'est jamais utilisée à des fins commerciales ou de prospection.",
                    "Les réponses au quiz (sans données sensibles) afin de calculer ton profil métier RH et te recommander un métier adapté.",
                    "Éventuellement ton retour d'expérience (avis, commentaires) si tu choisis d'en laisser un.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-heading font-bold text-foreground text-sm mb-1.5">
                  3. Finalités du traitement
                </h2>
                <p className="mb-2">Ces données sont utilisées pour :</p>
                <ul className="list-none space-y-2">
                  {[
                    "te permettre d'accéder à tes sessions de quiz et à tes résultats ;",
                    "t'afficher des recommandations de métiers RH adaptées à tes réponses ;",
                    "permettre à Sup des RH de te recontacter uniquement si tu le demandes explicitement.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {[
                {
                  title: "4. Conservation des données",
                  content:
                    "Tes sessions de quiz et ton e‑mail sont conservés pendant une durée proportionnée au suivi de ton projet d'orientation. Tu peux demander la suppression de tes sessions et de ton compte en contactant Sup des RH.",
                },
                {
                  title: "5. Partage des données",
                  content:
                    "Les données collectées via l'outil Quiz SUP des RH sont utilisées uniquement par Sup des RH et ses prestataires techniques pour le fonctionnement du service. Elles ne sont ni revendues, ni utilisées à des fins publicitaires pour des tiers.",
                },
                {
                  title: "6. Tes droits",
                  content:
                    "Conformément à la réglementation applicable (RGPD), tu disposes d'un droit d'accès, de rectification, de suppression et de limitation du traitement de tes données. Tu peux également t'opposer à certains traitements légitimes.",
                },
              ].map((section) => (
                <div key={section.title}>
                  <h2 className="font-heading font-bold text-foreground text-sm mb-1.5">
                    {section.title}
                  </h2>
                  <p className="leading-relaxed">{section.content}</p>
                </div>
              ))}

              <p className="leading-relaxed">
                Pour exercer ces droits, contacte Sup des RH via les coordonnées indiquées sur le
                site officiel de l&apos;école en précisant l&apos;adresse e‑mail utilisée pour le
                quiz.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
