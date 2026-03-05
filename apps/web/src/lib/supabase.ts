import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let url = supabaseUrl;
let key = supabaseAnonKey;

if (!url || !key) {
  console.warn(
    "[SupdesRH][web] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans apps/web/.env – l'app affichera l'UI mais l'auth Supabase ne fonctionnera pas.",
  );
  // Valeurs factices pour éviter un crash en dev : à remplacer par tes vraies clés dans .env.
  url = "https://example.supabase.co";
  key = "public-anon-key";
}

export const supabase = createClient(url, key, {
  auth: {
    flowType: "implicit",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
