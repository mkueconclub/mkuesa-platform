import type { UserRole } from "@/lib/auth/roles";

// Hand-written for the columns the app reads. Replace with generated types
// (`supabase gen types typescript`) once the project is linked.
export type MembershipStatus = "pending" | "approved" | "rejected" | "suspended" | "expired";

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  programme: string | null;
  year_of_study: number | null;
  role: UserRole;
};

export type MembershipRow = {
  status: MembershipStatus;
  academic_year: string;
  membership_number: string | null;
  rejection_reason: string | null;
};
