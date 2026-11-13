import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter an email address.")
  .max(254, "Use 254 characters or fewer.")
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email address.");

/** A visitor's message to one executive. Mirrors public.submit_executive_message() in SQL. */
export const executiveMessageSchema = z.object({
  executiveId: z.uuid("Unknown officer."),
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: emailField,
  subject: z.string().trim().min(3, "Enter a subject.").max(150),
  message: z.string().trim().min(10, "Write at least 10 characters.").max(2000, "Keep it under 2000 characters."),
  website: z.string().max(0).optional(), // honeypot: humans never see or fill this
});

/** An officer's own contact details. Mirrors public.set_my_executive_contact() in SQL. */
export const executiveContactSchema = z.object({
  email: emailField,
  bio: z.string().trim().max(1000, "Use 1000 characters or fewer.").optional().transform((v) => v || undefined),
});

export const executiveMessageStatuses = ["new", "read", "replied", "spam"] as const;

export const executiveMessageStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(executiveMessageStatuses),
});

/** Super Administrator approval of a committee entry. The account is required to approve, not to withdraw. */
export const executiveApprovalSchema = z.object({
  id: z.uuid(),
  intent: z.enum(["approve", "withdraw"]),
  profileId: z.string().trim().optional(),
});
