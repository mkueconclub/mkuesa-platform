import { useId, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

type SelectProps = Omit<ComponentPropsWithoutRef<"select">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  options: readonly { value: string; label: string }[];
  hideLabel?: boolean;
};

export function Select({ label, hint, error, id, className, options, hideLabel, ...props }: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className={hideLabel ? "sr-only" : "block text-sm font-medium text-ink"}>
        {label}
      </label>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={cn(
          "h-11 w-full rounded-md border bg-paper px-3 text-base text-ink",
          error ? "border-red-700" : "border-brand-200 hover:border-brand-400",
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <p id={hintId} className="text-sm text-muted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}
