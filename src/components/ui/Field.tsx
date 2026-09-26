import { cn } from "@/lib/cn";

type BaseProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  hideLabel?: boolean;
};

function fieldIds(name: string, error?: string, hint?: string) {
  return {
    errorId: error ? `${name}-error` : undefined,
    hintId: hint ? `${name}-hint` : undefined,
  };
}

function describedBy(name: string, error?: string, hint?: string) {
  return [error ? `${name}-error` : null, hint ? `${name}-hint` : null].filter(Boolean).join(" ") || undefined;
}

export function FieldShell({
  label,
  name,
  error,
  hint,
  required,
  className,
  hideLabel,
  children,
}: BaseProps & { children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={name} className={cn("field-label", hideLabel && "sr-only")}>
        {label}
        {required ? (
          <span className="text-clay-600" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${name}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  defaultValue,
  value,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  step,
  min,
  max,
  readOnly,
  disabled,
  ...base
}: BaseProps & {
  defaultValue?: string | number;
  value?: string | number;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url" | "search";
  step?: string | number;
  min?: string | number;
  max?: string | number;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const { error, hint } = base;
  return (
    <FieldShell {...base}>
      <input
        id={base.name}
        name={base.name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        step={step}
        min={min}
        max={max}
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(base.name, error, hint)}
        aria-required={base.required || undefined}
        className={cn("field-input", error && "border-danger-600", readOnly && "bg-sand-100 text-ink-700")}
      />
    </FieldShell>
  );
}

export function TextArea({
  rows = 5,
  defaultValue,
  value,
  placeholder,
  ...base
}: BaseProps & {
  rows?: number;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
}) {
  const { error, hint } = base;
  return (
    <FieldShell {...base}>
      <textarea
        id={base.name}
        name={base.name}
        rows={rows}
        defaultValue={defaultValue}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(base.name, error, hint)}
        aria-required={base.required || undefined}
        className={cn("field-input resize-y", error && "border-danger-600")}
      />
    </FieldShell>
  );
}

export function SelectField({
  options,
  defaultValue,
  value,
  ...base
}: BaseProps & {
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
  value?: string;
}) {
  const { error, hint } = base;
  return (
    <FieldShell {...base}>
      <select
        id={base.name}
        name={base.name}
        defaultValue={defaultValue}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(base.name, error, hint)}
        aria-required={base.required || undefined}
        className={cn("field-input cursor-pointer", error && "border-danger-600")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
  hint,
  description,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
  description?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-800">
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          aria-describedby={hint ? `${name}-hint` : undefined}
          className="mt-0.5 size-4 shrink-0 accent-clay-600"
        />
        <span>
          <span className="font-medium">{label}</span>
          {description ? <span className="block text-ink-600">{description}</span> : null}
        </span>
      </label>
      {hint ? (
        <p id={`${name}-hint`} className="field-hint ml-6">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { fieldIds };
