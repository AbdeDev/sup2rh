import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connexion en cours…");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          setStatus(
            "Session introuvable. Vérifie que le lien s’ouvre dans le même navigateur/profil et que Supabase Redirect URLs est bien sur http://localhost:5173/auth/callback",
          );
          return;
        }

        await supabase.from("profiles").upsert({ id: data.session.user.id }, { onConflict: "id" });

        navigate("/quiz", { replace: true });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erreur d’authentification.";
        setStatus(message);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="border rounded-xl p-6 max-w-md w-full">
        <div className="text-lg font-semibold">Authentification</div>
        <div className="text-sm opacity-80 mt-2">{status}</div>
      </div>
    </div>
  );
}
