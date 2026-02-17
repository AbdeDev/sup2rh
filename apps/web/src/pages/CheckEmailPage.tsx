import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "../../../web/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../web/src/components/ui/card";

function useQueryParam(name: string) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name), [search, name]);
}

export function CheckEmailPage() {
  const email = useQueryParam("email");

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vérifie ta boîte mail</CardTitle>
          <CardDescription>
            Clique sur le lien de connexion{email ? ` envoyé à ${email}` : ""}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Si tu ne vois rien, vérifie tes spams. Une fois cliqué, tu seras redirigé vers le quiz.
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Retour</Link>
            </Button>

            <Button asChild className="w-full">
              <Link to="/quiz">J’ai cliqué</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
