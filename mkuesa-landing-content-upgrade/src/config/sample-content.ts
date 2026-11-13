/**
 * SAMPLE CONTENT: placeholder only. None of this is official.
 * It exists so the layout can be reviewed. Replaced by database content in
 * Phases 3-5. Every item must stay flagged `sample: true`.
 */
export type SampleBase = { slug: string; title: string; summary: string; sample: true };

export type SampleEvent = SampleBase & {
  startsAt: string;
  location: string;
  status: "upcoming" | "past";
  description: string;
};

export const sampleEvents: readonly SampleEvent[] = [
  {
    slug: "economics-careers-panel",
    title: "Economics careers panel",
    summary: "An open conversation about careers for economics and finance graduates.",
    description:
      "Sample event description. This is placeholder text showing how a full event description will appear, including the agenda, speakers and what to bring.",
    startsAt: "2026-12-04T14:00:00+03:00",
    location: "Venue to be confirmed",
    status: "upcoming",
    sample: true,
  },
  {
    slug: "inter-class-economics-quiz",
    title: "Inter-class economics quiz",
    summary: "A friendly competition testing economic knowledge across classes.",
    description: "Sample event description. Rules, teams and prizes will be listed here.",
    startsAt: "2026-12-11T15:00:00+03:00",
    location: "Venue to be confirmed",
    status: "upcoming",
    sample: true,
  },
  {
    slug: "new-students-welcome-session",
    title: "New students welcome session",
    summary: "An introduction to the association for new economics students.",
    description: "Sample past-event description, with a summary of what took place.",
    startsAt: "2026-09-12T10:00:00+03:00",
    location: "Venue to be confirmed",
    status: "past",
    sample: true,
  },
  {
    slug: "reading-the-economy-workshop",
    title: "Reading the economy workshop",
    summary: "A hands-on session on interpreting economic indicators.",
    description: "Sample past-event description, with a summary of what took place.",
    startsAt: "2026-10-08T14:00:00+03:00",
    location: "Venue to be confirmed",
    status: "past",
    sample: true,
  },
];

export const sampleAnnouncements: readonly SampleBase[] = [
  { slug: "membership-applications", title: "Find your place in the MKUESA community", summary: "Discover a community built around shared learning, fresh perspectives and meaningful connections. Explore membership, meet fellow economics students and find your own way to contribute.", sample: true },
  { slug: "upcoming-careers-panel", title: "Careers panel registration", summary: "Placeholder announcement about an upcoming event.", sample: true },
  { slug: "new-learning-resources", title: "New learning resources", summary: "Placeholder announcement about resources added to the Learning Hub.", sample: true },
];

export const resourceCategories = [
  { id: "economics", label: "Economics" },
  { id: "finance", label: "Finance and investment" },
  { id: "academic", label: "Academic materials" },
  { id: "courses", label: "Recommended courses" },
  { id: "video", label: "Video lessons" },
] as const;
export type ResourceCategory = (typeof resourceCategories)[number]["id"];

export type SampleResource = SampleBase & { category: ResourceCategory };

export const sampleResources: readonly SampleResource[] = [
  { slug: "micro-notes", category: "economics", title: "Microeconomics revision notes", summary: "Placeholder: summarised notes for revision.", sample: true },
  { slug: "macro-guide", category: "economics", title: "Macroeconomics study guide", summary: "Placeholder: a guide to core macroeconomic concepts.", sample: true },
  { slug: "investing-basics", category: "finance", title: "Introduction to investing", summary: "Placeholder: an overview of financial markets for beginners.", sample: true },
  { slug: "past-papers", category: "academic", title: "Past papers collection", summary: "Placeholder: examination papers for practice.", sample: true },
  { slug: "recommended-course", category: "courses", title: "Recommended online course", summary: "Placeholder: a course suggested by the association.", sample: true },
  { slug: "video-lesson", category: "video", title: "Video lesson: supply and demand", summary: "Placeholder: a recorded lesson.", sample: true },
];

export const publicationTypes = [
  { id: "student_research", label: "Student research" },
  { id: "article", label: "Articles" },
  { id: "analysis", label: "Economic analysis" },
  { id: "association", label: "Association publications" },
] as const;
export type PublicationType = (typeof publicationTypes)[number]["id"];

export type SamplePublication = SampleBase & { type: PublicationType };

export const samplePublications: readonly SamplePublication[] = [
  { slug: "student-research-sample", type: "student_research", title: "Student research paper", summary: "Placeholder: an abstract of student research.", sample: true },
  { slug: "article-sample", type: "article", title: "Opinion article", summary: "Placeholder: an article by a student or member.", sample: true },
  { slug: "analysis-sample", type: "analysis", title: "Economic analysis brief", summary: "Placeholder: a short analysis of a current economic issue.", sample: true },
  { slug: "newsletter-sample", type: "association", title: "Association newsletter", summary: "Placeholder: a publication from the association.", sample: true },
];

export const opportunityCategories = [
  { id: "internship", label: "Internships" },
  { id: "scholarship", label: "Scholarships" },
  { id: "competition", label: "Competitions" },
  { id: "conference", label: "Conferences" },
  { id: "career", label: "Career opportunities" },
] as const;
export type OpportunityCategory = (typeof opportunityCategories)[number]["id"];

export type SampleOpportunity = SampleBase & { category: OpportunityCategory };

export const sampleOpportunities: readonly SampleOpportunity[] = opportunityCategories.map((c) => ({
  slug: `${c.id}-sample`,
  category: c.id,
  title: `${c.label.replace(/s$/, "")} listing`,
  summary: "Placeholder: organisation, requirements and deadline will appear here.",
  sample: true as const,
}));
