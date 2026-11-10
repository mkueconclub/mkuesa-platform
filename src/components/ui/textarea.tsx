import { useId, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

type TextareaProps = Omit<ComponentPropsWithoutRef<"textarea">, "id"> & { label: string; hint?: string; error?: string; id?: string };

export function Textarea({ label, hint, error, id, className, ...props }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "min-h-32 w-full rounded-md border bg-paper px-3 py-2 text-base text-ink placeholder:text-slate",
          error ? "border-red-700" : "border-brand-200 hover:border-brand-400",
          className,
        )}
        {...props}
      />
      {hint && <p id={hintId} className="text-sm text-muted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
