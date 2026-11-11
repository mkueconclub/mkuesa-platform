/** Shared helpers for Server Actions that back forms. Not a "use server" file, so plain values may be exported. */

export type FormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Echo of what the person typed (never passwords), so React 19's automatic form reset does not wipe the fields. */
  values?: Record<string, string>;
};

export const formData2obj = (fd: FormData) => Object.fromEntries(fd.entries());

const SECRET_FIELDS = new Set(["password", "confirm", "next"]);

export function echo(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !SECRET_FIELDS.has(k)) out[k] = v;
  return out;
}

export const invalid = (errors: Record<string, string>, fd?: FormData): FormState => ({
  ok: false,
  message: "Please correct the highlighted fields.",
  errors,
  values: fd ? echo(fd) : undefined,
});

export const NOT_CONFIGURED: FormState = {
  ok: false,
  message: "The service is not configured yet (Supabase keys are missing). Fill in .env.local and restart the dev server.",
};
