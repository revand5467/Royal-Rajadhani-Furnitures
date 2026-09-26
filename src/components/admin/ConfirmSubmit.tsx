"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Two-step destructive action. The first click arms the control, the second
 * submits — no `window.confirm`, so it is keyboard accessible and styled.
 * Rendered inside a <form> whose action performs the deletion.
 */
export function ConfirmSubmit({
  children,
  question,
  confirmLabel = "Delete",
  className,
  pending = false,
}: {
  children: React.ReactNode;
  question: string;
  confirmLabel?: string;
  className?: string;
  pending?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const hintId = useId();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-describedby={hintId}
        className={cn("btn btn-danger", className)}
      >
        {children}
        <span id={hintId} className="sr-only">
          — asks for confirmation before deleting
        </span>
      </button>
    );
  }

  return (
    <span role="group" aria-label="Confirm deletion" className="inline-flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-danger-600">{question}</span>
      <button type="submit" className="btn btn-danger" disabled={pending}>{confirmLabel}</button>
      <button type="button" onClick={() => setArmed(false)} className="text-xs text-ink-600 underline underline-offset-2">
        Cancel
      </button>
    </span>
  );
}
