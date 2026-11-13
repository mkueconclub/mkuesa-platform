import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AlumniProfile = {
  id: string; graduation_year: number; organisation: string | null; position_title: string | null; bio: string | null;
  open_to_mentoring: boolean; linkedin_url: string | null; status: "pending" | "approved" | "rejected";
};

export async function getAlumniProfile(userId: string): Promise<AlumniProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("alumni_profiles")
    .select("id, graduation_year, organisation, position_title, bio, open_to_mentoring, linkedin_url, status")
    .eq("id", userId)
    .maybeSingle();
  return (data as AlumniProfile | null) ?? null;
}
