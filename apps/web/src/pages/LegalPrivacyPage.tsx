import { useNavigate } from "react-router-dom";

import { AppLogo } from "../components/AppLogo";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";

export function LegalPrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center gap-2 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity -ml-0.5"
            aria-label="Accueil"
          >
            <AppLogo className="h-10 w-10 object-contain transition-transform duration-200 hover:scale-110" />
            <span className="text-xs font-medium text-foreground">
              Politique de confidentialité
            </span>
          </button>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="border border-border bg-card">
            <CardContent className="p-5 md:p-6 space-y-4 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Quizz SupDesRh · Lamascott
              </p>
              <h1 className="text-lg font-heading font-semibold text-foreground">
                Politique de confidentialité
              </h1>
              <p>
                Cette politique de confidentialité explique quelles données personnelles sont
                collectées lorsque tu utilises l&apos;outil d&apos;orientation Quizz SupDesRh
                (Lamascott), comment elles sont utilisées et quels sont tes droits.
              </p>

              <h2 className="font-semibold text-foreground text-sm">
                1. Responsable du traitement
              </h2>
              <p>
                Le responsable du traitement des données est Sup des RH, établissement
                d&apos;enseignement spécialisé dans les Ressources Humaines.
              </p>

              <h2 className="font-semibold text-foreground text-sm">2. Données collectées</h2>
              <p>Nous collectons principalement :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Ton adresse e‑mail pour créer ton compte et t&apos;envoyer le lien de connexion
                  (magic link).
                </li>
                <li>
                  Les réponses au quiz (sans données sensibles) afin de calculer ton profil métier
                  RH et te recommander un métier adapté.
                </li>
                <li>
                  Éventuellement ton retour d&apos;expérience (avis, commentaires) si tu choisis
                  d&apos;en laisser un.
                </li>
              </ul>

              <h2 className="font-semibold text-foreground text-sm">3. Finalités du traitement</h2>
              <p>Ces données sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>te permettre d&apos;accéder à tes sessions de quiz et à tes résultats ;</li>
                <li>
                  t&apos;afficher des recommandations de métiers RH adaptées à tes réponses
                  (Recrutement, Paie, QVCT, Formation, etc.) ;
                </li>
                <li>
                  permettre à Sup des RH de te recontacter uniquement si tu le demandes
                  explicitement (demande de contact pour alternance ou stage).
                </li>
              </ul>

              <h2 className="font-semibold text-foreground text-sm">4. Conservation des données</h2>
              <p>
                Tes sessions de quiz et ton e‑mail sont conservés pendant une durée proportionnée au
                suivi de ton projet d&apos;orientation. Tu peux demander la suppression de tes
                sessions et de ton compte en contactant Sup des RH.
              </p>

              <h2 className="font-semibold text-foreground text-sm">5. Partage des données</h2>
              <p>
                Les données collectées via l&apos;outil Quizz SupDesRh sont utilisées uniquement par
                Sup des RH et ses prestataires techniques pour le fonctionnement du service. Elles
                ne sont ni revendues, ni utilisées à des fins publicitaires pour des tiers.
              </p>

              <h2 className="font-semibold text-foreground text-sm">6. Tes droits</h2>
              <p>
                Conformément à la réglementation applicable (RGPD), tu disposes d&apos;un droit
                d&apos;accès, de rectification, de suppression et de limitation du traitement de tes
                données. Tu peux également t&apos;opposer à certains traitements légitimes.
              </p>
              <p>
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
