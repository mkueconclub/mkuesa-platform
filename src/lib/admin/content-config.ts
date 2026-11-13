import type { ContentKind } from "@/lib/auth/permissions";

/** Describes each kind of managed content once; the list pages, forms and validation are all driven from this. */
export type FieldType = "text" | "textarea" | "select" | "datetime" | "number" | "checkbox" | "url" | "tags";
export type Option = { value: string; label: string };
export type Field = {
  name: string; // database column
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly Option[];
  hint?: string;
  min?: number; // text: minimum length; number: minimum value
  max?: number; // text: maximum length; number: maximum value
};
export type ListColumn = { field: string; label: string; type?: "badge" | "date" | "text" };

export type ContentConfig = {
  kind: ContentKind;
  table: string;
  basePath: string;
  label: string; // plural
  singular: string;
  description: string;
  titleField: string;
  hasSlug: boolean;
  statusField: string | null;
  fields: readonly Field[];
  defaults: Record<string, string>; // initial values of the "new" form
  list: readonly ListColumn[];
  orderBy: { column: string; ascending: boolean };
};

const visibility: Option[] = [
  { value: "public", label: "Public (everyone)" },
  { value: "members", label: "Members only" },
];
const contentStatus: Option[] = [
  { value: "draft", label: "Draft (not shown)" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const contentConfigs: Record<ContentKind, ContentConfig> = {
  announcements: {
    kind: "announcements",
    table: "announcements",
    basePath: "/admin/announcements",
    label: "Announcements",
    singular: "announcement",
    description: "News and updates shown to members and, if public, to visitors.",
    titleField: "title",
    hasSlug: true,
    statusField: "status",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, min: 3, max: 200 },
      { name: "body", label: "Message", type: "textarea", required: true, max: 20000, hint: "Plain text. Line breaks are kept." },
      { name: "visibility", label: "Who can see it", type: "select", required: true, options: visibility },
      { name: "status", label: "Status", type: "select", required: true, options: contentStatus },
      { name: "is_pinned", label: "Pin to the top", type: "checkbox" },
    ],
    defaults: { visibility: "public", status: "draft" },
    list: [
      { field: "title", label: "Title" },
      { field: "status", label: "Status", type: "badge" },
      { field: "visibility", label: "Visibility", type: "badge" },
      { field: "published_at", label: "Published", type: "date" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },
  events: {
    kind: "events",
    table: "events",
    basePath: "/admin/events",
    label: "Events",
    singular: "event",
    description: "Workshops, talks, competitions and meetings. Times are in Nairobi time.",
    titleField: "title",
    hasSlug: true,
    statusField: "status",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, min: 3, max: 200 },
      { name: "description", label: "Description", type: "textarea", required: true, max: 20000 },
      { name: "location", label: "Location", type: "text", max: 200 },
      { name: "starts_at", label: "Starts", type: "datetime", required: true },
      { name: "ends_at", label: "Ends (optional)", type: "datetime" },
      { name: "capacity", label: "Capacity (optional)", type: "number", min: 1, max: 100000, hint: "Leave blank for unlimited. When full, people join a waiting list." },
      { name: "registration_required", label: "People must register", type: "checkbox" },
      { name: "registration_deadline", label: "Registration deadline (optional)", type: "datetime" },
      { name: "visibility", label: "Who can see it", type: "select", required: true, options: visibility },
      { name: "status", label: "Status", type: "select", required: true, options: contentStatus },
    ],
    defaults: { visibility: "public", status: "draft", registration_required: "on" },
    list: [
      { field: "title", label: "Title" },
      { field: "starts_at", label: "Starts", type: "date" },
      { field: "status", label: "Status", type: "badge" },
      { field: "visibility", label: "Visibility", type: "badge" },
    ],
    orderBy: { column: "starts_at", ascending: false },
  },
  resources: {
    kind: "resources",
    table: "resources",
    basePath: "/admin/resources",
    label: "Learning resources",
    singular: "resource",
    description: "Links to learning material. File uploads arrive with secure storage, so for now each resource is a web link.",
    titleField: "title",
    hasSlug: true,
    statusField: "status",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, min: 3, max: 200 },
      { name: "description", label: "Description", type: "textarea", max: 5000 },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: [
          { value: "economics", label: "Economics" },
          { value: "finance_investment", label: "Finance and investment" },
          { value: "academic_material", label: "Academic materials" },
          { value: "recommended_course", label: "Recommended courses" },
          { value: "video_lesson", label: "Video lessons" },
        ],
      },
      {
        name: "kind",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "link", label: "Web link" },
          { value: "video", label: "Video" },
          { value: "file", label: "Document (hosted elsewhere)" },
        ],
      },
      { name: "external_url", label: "Link", type: "url", required: true, max: 2000, hint: "Must start with http:// or https://" },
      { name: "tags", label: "Tags (optional)", type: "tags", hint: "Separate with commas." },
      { name: "visibility", label: "Who can see it", type: "select", required: true, options: visibility },
      { name: "status", label: "Status", type: "select", required: true, options: contentStatus },
    ],
    defaults: { visibility: "members", status: "draft", kind: "link", category: "economics" },
    list: [
      { field: "title", label: "Title" },
      { field: "category", label: "Category", type: "badge" },
      { field: "status", label: "Status", type: "badge" },
      { field: "visibility", label: "Visibility", type: "badge" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },
  research: {
    kind: "research",
    table: "research_publications",
    basePath: "/admin/research",
    label: "Research and publications",
    singular: "publication",
    description: "Articles, economic analysis and student research. Published items appear on the public Research page.",
    titleField: "title",
    hasSlug: true,
    statusField: "status",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, min: 3, max: 250 },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "student_research", label: "Student research" },
          { value: "article", label: "Article" },
          { value: "economic_analysis", label: "Economic analysis" },
          { value: "association_publication", label: "Association publication" },
        ],
      },
      { name: "author_name", label: "Author name(s)", type: "text", max: 120 },
      { name: "abstract", label: "Abstract", type: "textarea", max: 3000 },
      { name: "body", label: "Full text", type: "textarea", max: 100000 },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "draft", label: "Draft" },
          { value: "submitted", label: "Submitted" },
          { value: "in_review", label: "In review" },
          { value: "published", label: "Published" },
          { value: "rejected", label: "Rejected" },
        ],
      },
    ],
    defaults: { status: "draft", type: "article" },
    list: [
      { field: "title", label: "Title" },
      { field: "type", label: "Type", type: "badge" },
      { field: "status", label: "Status", type: "badge" },
      { field: "published_at", label: "Published", type: "date" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },
  opportunities: {
    kind: "opportunities",
    table: "opportunities",
    basePath: "/admin/opportunities",
    label: "Opportunities",
    singular: "opportunity",
    description: "Internships, scholarships, competitions, conferences and careers.",
    titleField: "title",
    hasSlug: true,
    statusField: "status",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, min: 3, max: 200 },
      { name: "organisation", label: "Organisation", type: "text", max: 150 },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: [
          { value: "internship", label: "Internship" },
          { value: "attachment", label: "Industrial attachment" },
          { value: "graduate_trainee", label: "Graduate trainee programme" },
          { value: "mentorship", label: "Mentorship" },
          { value: "research_collaboration", label: "Research collaboration" },
          { value: "scholarship", label: "Scholarship" },
          { value: "competition", label: "Competition" },
          { value: "conference", label: "Conference" },
          { value: "career", label: "Career" },
        ],
      },
      { name: "description", label: "Description", type: "textarea", required: true, max: 20000 },
      { name: "eligibility", label: "Eligibility (optional)", type: "textarea", max: 2000 },
      { name: "contact", label: "Contact details (optional)", type: "text", max: 300 },
      { name: "apply_url", label: "Application link (optional)", type: "url", max: 2000, hint: "Must start with http:// or https://" },
      { name: "location", label: "Location", type: "text", max: 200 },
      { name: "deadline", label: "Deadline (optional)", type: "datetime" },
      { name: "visibility", label: "Who can see it", type: "select", required: true, options: visibility },
      { name: "status", label: "Status", type: "select", required: true, options: contentStatus },
    ],
    defaults: { visibility: "public", status: "draft", category: "internship" },
    list: [
      { field: "title", label: "Title" },
      { field: "category", label: "Category", type: "badge" },
      { field: "deadline", label: "Deadline", type: "date" },
      { field: "status", label: "Status", type: "badge" },
    ],
    orderBy: { column: "created_at", ascending: false },
  },
  committee: {
    kind: "committee",
    table: "executive_positions",
    basePath: "/admin/committee",
    label: "Executive committee",
    singular: "committee entry",
    description: "Who holds each position. A name is shown publicly only when the officer has consented AND the website setting allows it.",
    titleField: "display_name",
    hasSlug: false,
    statusField: null,
    fields: [
      { name: "display_name", label: "Name", type: "text", required: true, min: 2, max: 120 },
      { name: "position_title", label: "Position", type: "text", required: true, min: 2, max: 80 },
      { name: "bio", label: "Short bio (optional)", type: "textarea", max: 1000 },
      { name: "term_label", label: "Term (e.g. 2026/2027)", type: "text", max: 20 },
      { name: "display_order", label: "Display order", type: "number", required: true, min: 0, max: 1000, hint: "Lower numbers appear first." },
      { name: "is_current", label: "Currently serving", type: "checkbox" },
      { name: "public_consent", label: "This officer has consented to their name being shown publicly", type: "checkbox" },
    ],
    defaults: { display_order: "0", is_current: "on" },
    list: [
      { field: "display_name", label: "Name" },
      { field: "position_title", label: "Position" },
      { field: "term_label", label: "Term" },
    ],
    orderBy: { column: "display_order", ascending: true },
  },
};

export function getContentConfig(kind: unknown): ContentConfig | null {
  return typeof kind === "string" && kind in contentConfigs ? contentConfigs[kind as ContentKind] : null;
}

/** Kinds of certificate the association can issue (stored as free text, up to 40 characters, in the database). */
export const certificateTypes = ["participation", "attendance", "completion", "achievement", "appreciation"] as const;
