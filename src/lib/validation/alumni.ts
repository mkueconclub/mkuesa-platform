import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Use ${max} characters or fewer.`).optional().transform((v) => v || undefined);
const url = z.string().trim().max(2000).optional().transform((v) => v || undefined).refine((v) => v === undefined || /^https?:\/\//i.test(v), "Must start with http:// or https://");

export const alumniProfileSchema = z.object({
  graduationYear: z.preprocess((v) => Number(v), z.number().int().min(1990, "Enter a year from 1990.").max(2100, "Enter a valid year.")),
  organisation: text(150),
  positionTitle: text(150),
  bio: text(2000),
  linkedinUrl: url,
  openToMentoring: z.preprocess((v) => v === "on", z.boolean()),
});

export const alumniOpportunityCategories = [
  { value: "attachment", label: "Industrial attachment" },
  { value: "internship", label: "Internship" },
  { value: "career", label: "Career opportunity" },
  { value: "graduate_trainee", label: "Graduate trainee programme" },
  { value: "scholarship", label: "Scholarship" },
  { value: "mentorship", label: "Mentorship offer" },
  { value: "research_collaboration", label: "Research collaboration" },
] as const;

export const alumniOpportunitySchema = z.object({
  category: z.enum(alumniOpportunityCategories.map((c) => c.value) as [string, ...string[]], "Choose an opportunity type."),
  title: z.string().trim().min(3, "Enter a title.").max(200),
  organisation: z.string().trim().min(2, "Enter the organisation.").max(150),
  description: z.string().trim().min(20, "Describe the opportunity (at least 20 characters).").max(20000),
  eligibility: text(2000),
  deadline: text(40).refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), "Enter a valid date."),
  applyUrl: url,
  contact: z.string().trim().min(3, "Enter official contact details.").max(300),
});

/** Followers (approved members) needed, strictly more than this, for the Verified badge. Mirrors alumni_directory() in SQL. */
export const verifiedFollowerThreshold = 50;

export const connectTopics = [
  { value: "idea", label: "Idea" },
  { value: "career", label: "Career" },
  { value: "mentorship", label: "Mentorship" },
  { value: "collaboration", label: "Collaboration" },
  { value: "general", label: "General" },
] as const;

export const connectPostSchema = z.object({
  topic: z.enum(connectTopics.map((t) => t.value) as [string, ...string[]], "Choose a topic."),
  title: z.string().trim().min(3, "Enter a title.").max(160, "Use 160 characters or fewer."),
  body: z.string().trim().min(1, "Write something to share.").max(5000, "Use 5,000 characters or fewer."),
});
export const connectReplySchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a reply.").max(2000, "Use 2,000 characters or fewer."),
});
