import { z } from "zod";

const count = z.coerce.number().int().min(0);

export const analyticsSchema = z.object({
  applications_by_month: z.array(z.object({ month: z.string(), applied: count, approved: count })),
  events: z.array(
    z.object({
      title: z.string(),
      starts_at: z.string(),
      capacity: z.number().int().nullable(),
      signed_up: count,
      attended: count,
      waitlisted: count,
    }),
  ),
  members_by_year: z.array(z.object({ label: z.string(), count })),
  programmes: z.array(z.object({ label: z.string(), count })),
});

export type Analytics = z.infer<typeof analyticsSchema>;

/** Checks the shape of what the database returned, so a bad response shows a message instead of breaking the page. */
export function parseAnalytics(data: unknown): Analytics | null {
  const r = analyticsSchema.safeParse(data);
  return r.success ? r.data : null;
}
