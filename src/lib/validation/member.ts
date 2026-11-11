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
