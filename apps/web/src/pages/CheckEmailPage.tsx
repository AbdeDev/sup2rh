import { useSearchParams, Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";

export function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 border border-success/30 mb-4 transition-transform duration-200 hover:scale-105">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h1 className="text-lg font-heading font-semibold text-foreground mb-2">
            Vérifie ta boîte mail
          </h1>
          <p className="text-xs text-muted-foreground">On t&apos;a envoyé un lien de connexion</p>
        </div>
        <Card className="border border-border bg-card transition-all duration-200 hover:border-primary/50">
          <CardHeader className="pb-3">
            {email && (
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border border-border bg-muted/50 mb-3 transition-colors duration-200">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground truncate max-w-[240px]">
                  {email}
                </span>
              </div>
            )}
            <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground ml-2 text-left">
              <li>Ouvre ton email</li>
              <li>Clique sur le lien</li>
              <li>Tu seras connecté automatiquement</li>
            </ol>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="p-3 rounded-md border border-border bg-muted/30 transition-colors duration-200">
              <p className="text-[11px] text-muted-foreground">
                💡 Pense à vérifier les spams si tu ne vois pas le mail.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full h-9 text-sm border-border text-foreground hover:bg-accent transition-all duration-200"
            >
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
