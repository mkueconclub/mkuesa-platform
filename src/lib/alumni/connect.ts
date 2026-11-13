import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DirectoryEntry = {
  id: string; full_name: string; graduation_year: number; organisation: string | null; position_title: string | null; bio: string | null;
  linkedin_url: string | null; open_to_mentoring: boolean; follower_count: number; is_verified: boolean; followed_by_me: boolean;
};

/** Approved alumni with follower counts. Empty unless the caller is an approved member, approved alumnus or staff. */
export async function getDirectory(): Promise<DirectoryEntry[]> {
  const { data, error } = await (await createClient()).rpc("alumni_directory");
  if (error) {
    console.error("alumni directory failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as DirectoryEntry[];
}
