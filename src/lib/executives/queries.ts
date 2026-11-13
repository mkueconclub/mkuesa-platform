import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { PublicExecutive } from "@/lib/executives/profile";

const COLUMNS = "id, display_name, position_title, bio, term_label, display_order, contact_email";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPublicExecutives(): Promise<PublicExecutive[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient().from("executive_positions").select(COLUMNS).order("display_order", { ascending: true }).limit(50);
    if (error) {
      console.error("public executives failed:", error.code, error.message);
      return [];
    }
    return (data ?? []) as PublicExecutive[];
  } catch (e) {
    console.error("public executives threw:", e);
    return [];
  }
}

export async function getPublicExecutive(id: string): Promise<PublicExecutive | null> {
  if (!UUID_RE.test(id) || !isSupabaseConfigured()) return null;
  try {
    const { data, error } = await createPublicClient().from("executive_positions").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) {
      console.error("public executive failed:", error.code, error.message);
      return null;
    }
    return (data as PublicExecutive | null) ?? null;
  } catch (e) {
    console.error("public executive threw:", e);
    return null;
  }
}
