import { useNavigate } from "react-router-dom";

import { AppLogo } from "../components/AppLogo";
import { Card, CardContent } from "../components/ui/card";
import { ThemeToggle } from "../components/ThemeToggle";

export function LegalConditionsPage() {
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
              Conditions d&apos;utilisation
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
                Conditions d&apos;utilisation de l&apos;outil d&apos;orientation
              </h1>
              <p>
                Ces conditions d&apos;utilisation encadrent l&apos;accès et l&apos;utilisation de
                l&apos;outil d&apos;orientation en ligne proposé par Sup des RH (&quot;le
                service&quot;). En utilisant le service, tu acceptes ces conditions.
              </p>

              <h2 className="font-semibold text-foreground text-sm">1. Objet du service</h2>
              <p>
                Le service Quizz SupDesRh a pour objectif de t&apos;aider à découvrir les métiers
                des Ressources Humaines qui te correspondent le mieux, à travers un quiz court et
                personnalisé et des fiches métiers pédagogiques. Il s&apos;agit d&apos;un outil
                d&apos;orientation et de réflexion, sans valeur contractuelle ni engagement
                d&apos;admission.
              </p>

              <h2 className="font-semibold text-foreground text-sm">2. Création de compte</h2>
              <p>
                Pour sauvegarder tes résultats et retrouver tes sessions de quiz, tu dois créer un
                compte en renseignant ton adresse e‑mail. Tu t&apos;engages à fournir une adresse
                valide et à ne pas usurper l&apos;identité d&apos;une autre personne.
              </p>

              <h2 className="font-semibold text-foreground text-sm">3. Utilisation raisonnable</h2>
              <p>
                Tu t&apos;engages à utiliser le service de manière raisonnable, à ne pas tenter de
                perturber son fonctionnement (spam, attaque, collecte automatisée de données, etc.)
                et à ne pas l&apos;utiliser à des fins contraires à la loi ou à l&apos;image de Sup
                des RH.
              </p>

              <h2 className="font-semibold text-foreground text-sm">4. Résultats du quiz</h2>
              <p>
                Les résultats proposés par Lamascott reposent sur tes réponses et sur des règles
                d&apos;orientation internes (liens question ↔ fiche métier). Ils constituent une
                aide à la réflexion et ne constituent ni un diagnostic psychologique ni une promesse
                d&apos;emploi ou d&apos;admission en formation.
              </p>

              <h2 className="font-semibold text-foreground text-sm">5. Données et sécurité</h2>
              <p>
                Le fonctionnement du service suppose la collecte et le traitement de certaines
                données personnelles (voir la Politique de confidentialité). Sup des RH met en œuvre
                des mesures raisonnables pour protéger ces données, mais ne peut garantir une
                sécurité absolue sur Internet.
              </p>

              <h2 className="font-semibold text-foreground text-sm">6. Suspension du service</h2>
              <p>
                Sup des RH se réserve le droit de modifier, suspendre ou interrompre le service à
                tout moment, notamment en cas de maintenance technique, d&apos;évolution pédagogique
                ou de problème de sécurité.
              </p>

              <h2 className="font-semibold text-foreground text-sm">7. Propriété intellectuelle</h2>
              <p>
                Le service et son contenu sont protégés par le droit d&apos;auteur. La
                redistribution du code source est strictement interdite. L&apos;utilisation des
                artefacts de déploiement est soumise à la licence de distribution applicable (voir
                DISTRIBUTION_LICENSE).
              </p>

              <h2 className="font-semibold text-foreground text-sm">8. Contact et réclamation</h2>
              <p>
                Pour toute question sur ces conditions ou sur le fonctionnement de l&apos;outil, tu
                peux contacter directement l&apos;équipe Sup des RH via le site officiel de
                l&apos;école ou les coordonnées fournies dans l&apos;app.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
