import { z } from "zod";

/** Blank optional text becomes undefined; the caller stores that as NULL. */
const optionalText = (max: number, min = 0, minMessage = "Too short.") =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => v === undefined || v.length >= min, minMessage);

// Mirrors the CHECK constraints on public.profiles, so the database never has to be the one to say no.
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120, "Use 120 characters or fewer."),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => v === undefined || /^[0-9+() -]{7,20}$/.test(v), "Use 7 to 20 digits, spaces, + ( ) or -."),
  registrationNumber: optionalText(40, 3, "Use at least 3 characters."),
  programme: optionalText(120),
  yearOfStudy: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number("Enter a number from 1 to 8.").int("Year must be a whole number.").min(1, "Year must be 1 to 8.").max(8, "Year must be 1 to 8.").optional(),
  ),
});

export const eventIdSchema = z.object({ eventId: z.uuid("Unknown event.") });

// Student research submission. Plain text only; files arrive with secure storage in a later phase.
export const researchSchema = z.object({
  title: z.string().trim().min(3, "Enter a title of at least 3 characters.").max(250, "Use 250 characters or fewer."),
  authorName: z.string().trim().min(2, "Enter the author name(s).").max(120, "Use 120 characters or fewer."),
  abstract: z.string().trim().min(50, "Write an abstract of at least 50 characters.").max(3000, "Use 3,000 characters or fewer."),
  body: z
    .string()
    .trim()
    .max(100000, "Use 100,000 characters or fewer.")
    .optional()
    .transform((v) => v || undefined),
});
