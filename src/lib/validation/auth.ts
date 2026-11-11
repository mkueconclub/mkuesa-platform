import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254));

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email,
  password: z.string().min(10, "Use at least 10 characters.").max(72, "Use 72 characters or fewer."),
  programme: z.string().trim().max(120).optional().transform((v) => v || undefined),
  yearOfStudy: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1, "Year must be 1 to 8.").max(8, "Year must be 1 to 8.").optional(),
  ),
  consent: z.literal("on", "You must accept the privacy notice to register."),
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password.").max(72) });
export const resetRequestSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters.").max(72, "Use 72 characters or fewer."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });

export const membershipApplicationSchema = z.object({
  motivation: z.string().trim().max(500, "Keep it under 500 characters.").optional().transform((v) => v || undefined),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email,
  subject: z.string().trim().min(3, "Enter a subject.").max(150),
  message: z.string().trim().min(10, "Write at least 10 characters.").max(2000, "Keep it under 2000 characters."),
  website: z.string().max(0).optional(), // honeypot: humans never see or fill this
});

/** First error message per field, for display next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
