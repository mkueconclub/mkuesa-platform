import type { UserRole } from "@/lib/auth/roles";

// Hand-written for the columns the app reads. Replace with generated types
// (`supabase gen types typescript`) once the project is linked.
export type MembershipStatus = "pending" | "approved" | "rejected" | "suspended" | "expired";
export type Visibility = "public" | "members";
export type RegistrationStatus = "registered" | "waitlisted" | "cancelled" | "attended";
export type ResourceCategory = "economics" | "finance_investment" | "academic_material" | "recommended_course" | "video_lesson";
export type ResourceKind = "file" | "link" | "video";

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  programme: string | null;
  year_of_study: number | null;
  role: UserRole;
};

/** Profile columns a member may view and edit on their own profile page. */
export type ProfileDetailRow = ProfileRow & {
  phone: string | null;
  registration_number: string | null;
};

export type MembershipRow = {
  status: MembershipStatus;
  academic_year: string;
  membership_number: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  applied_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  registration_required: boolean;
  registration_deadline: string | null;
  visibility: Visibility;
};

export type RegistrationRow = {
  id: string;
  event_id: string;
  status: RegistrationStatus;
  registered_at: string;
  attended_at: string | null;
};

export type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  category: ResourceCategory;
  kind: ResourceKind;
  external_url: string | null;
  storage_path: string | null;
  tags: string[];
  visibility: Visibility;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  visibility: Visibility;
  is_pinned: boolean;
  published_at: string | null;
};

export type CertificateRow = {
  id: string;
  title: string;
  certificate_type: string;
  issued_at: string;
  verification_code: string;
  event: { title: string } | null;
};
