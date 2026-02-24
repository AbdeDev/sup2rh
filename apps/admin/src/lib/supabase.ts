import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let url = supabaseUrl;
let key = supabaseAnonKey;

if (!url || !key) {
  console.warn(
    "[SupdesRH][admin] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans apps/admin/.env – l'interface se charge mais certaines opérations admin nécessiteront une vraie config.",
  );
  url = "https://example.supabase.co";
  key = "public-anon-key";
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
