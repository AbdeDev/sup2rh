import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function useQueryParam(name: string) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name), [search, name]);
}

export function VerifyPage() {
  const email = useQueryParam("email") ?? "";
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Créer/assurer le profile row (role=USER) si absent
    const userId = data.session?.user.id;
    if (userId) {
      await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });
    }

    navigate("/quiz", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Vérification</h1>
        <p className="text-sm opacity-80">
          Saisis le code reçu par email{email ? ` : ${email}` : ""}.
        </p>

        <form className="space-y-3" onSubmit={verifyOtp}>
          <input
            className="w-full border rounded-lg px-3 py-2"
            inputMode="numeric"
            placeholder="Code (ex: 12345678)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button className="w-full rounded-lg px-3 py-2 border" type="submit" disabled={loading}>
            {loading ? "Vérification…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
