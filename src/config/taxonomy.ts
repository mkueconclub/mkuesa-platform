/**
 * The fixed categories used across the public pages. The ids are the exact values stored in the database
 * (see the enums in supabase/migrations/*_schema.sql); a test keeps the two in step.
 */
export const resourceCategories = [
  { id: "economics", label: "Economics" },
  { id: "finance_investment", label: "Finance and investment" },
  { id: "academic_material", label: "Academic materials" },
  { id: "recommended_course", label: "Recommended courses" },
  { id: "video_lesson", label: "Video lessons" },
] as const;

export const publicationTypes = [
  { id: "student_research", label: "Student research" },
  { id: "article", label: "Articles" },
  { id: "economic_analysis", label: "Economic analysis" },
  { id: "association_publication", label: "Association publications" },
] as const;

export const opportunityCategories = [
  { id: "internship", label: "Internships" },
  { id: "scholarship", label: "Scholarships" },
  { id: "competition", label: "Competitions" },
  { id: "conference", label: "Conferences" },
  { id: "career", label: "Career opportunities" },
] as const;

export type ResourceCategory = (typeof resourceCategories)[number]["id"];
export type PublicationType = (typeof publicationTypes)[number]["id"];
export type OpportunityCategory = (typeof opportunityCategories)[number]["id"];
