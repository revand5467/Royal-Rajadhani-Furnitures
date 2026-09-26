import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  children,
  action,
  className,
  compact,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-sand-300 bg-sand-100/60 text-center",
        compact ? "px-5 py-8" : "px-6 py-16",
        className,
      )}
    >
      <p className="font-display text-xl text-ink-950">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">{children}</div> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
