import { fromNairobiInput } from "@/lib/utils/date";
import type { ContentConfig, Field } from "@/lib/admin/content-config";

type Result = { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> };

const URL_RE = /^https?:\/\/\S+$/i;

/** Turns a lowercase URL-safe slug out of a title. Always matches the database pattern ^[a-z0-9]+(-[a-z0-9]+)*$. */
export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return s || "item";
}

function parseField(f: Field, raw: FormDataEntryValue | null, allowedStatuses?: readonly string[]): { value?: unknown; error?: string } {
  const text = typeof raw === "string" ? raw.trim() : "";
  const required = (msg = "This field is required.") => ({ error: msg });

  switch (f.type) {
    case "checkbox":
      return { value: raw === "on" };
    case "text":
    case "textarea":
    case "url": {
      if (!text) return f.required ? required() : { value: null };
      if (f.min && text.length < f.min) return { error: `Use at least ${f.min} characters.` };
      if (f.max && text.length > f.max) return { error: `Use ${f.max} characters or fewer.` };
      if (f.type === "url" && !URL_RE.test(text)) return { error: "Enter a web address starting with http:// or https://" };
      return { value: text };
    }
    case "select": {
      const allowed = (f.options ?? []).map((o) => o.value);
      if (!allowed.includes(text)) return required("Choose one of the options.");
      if (f.name === "status" && allowedStatuses && !allowedStatuses.includes(text)) return { error: "You can only save drafts." };
      return { value: text };
    }
    case "number": {
      if (!text) return f.required ? required() : { value: null };
      const n = Number(text);
      if (!Number.isInteger(n)) return { error: "Enter a whole number." };
      if (f.min !== undefined && n < f.min) return { error: `Must be at least ${f.min}.` };
      if (f.max !== undefined && n > f.max) return { error: `Must be ${f.max} or less.` };
      return { value: n };
    }
    case "datetime": {
      if (!text) return f.required ? required() : { value: null };
      const iso = fromNairobiInput(text);
      return iso ? { value: iso } : { error: "Enter a valid date and time." };
    }
    case "tags": {
      const tags = [...new Set(text.split(",").map((t) => t.trim()).filter(Boolean))];
      if (tags.length > 15) return { error: "Use 15 tags or fewer." };
      if (tags.some((t) => t.length > 40)) return { error: "Each tag must be 40 characters or fewer." };
      return { value: tags };
    }
  }
}

/** Validates a submitted form against a content type and returns the row to save. Pure, so it is unit-tested. */
export function parseContent(config: ContentConfig, fd: FormData, opts: { allowedStatuses?: readonly string[] } = {}): Result {
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};
  for (const f of config.fields) {
    const r = parseField(f, fd.get(f.name), opts.allowedStatuses);
    if (r.error) errors[f.name] = r.error;
    else data[f.name] = r.value;
  }
  if (config.kind === "events" && !errors.starts_at && !errors.ends_at && data.starts_at && data.ends_at) {
    if (new Date(data.ends_at as string) < new Date(data.starts_at as string)) errors.ends_at = "The end time must be after the start time.";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
