import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import { Button } from "../../../web/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../web/src/components/ui/card";

export function QuizPage() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Quiz (POC)</CardTitle>
            <CardDescription>
              Connecté ✅ {email ? `(${email})` : ""} — prochaine étape : questions + scoring.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={logout}>
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
