import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseKey.length > 0 &&
  !supabaseUrl.includes("your-project");

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseKey
    );
  }

  return supabaseInstance;
}