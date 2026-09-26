import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { className: string; Icon: typeof Info; role: "status" | "alert" }> = {
  info: { className: "bg-sand-100 text-ink-800 border-sand-300", Icon: Info, role: "status" },
  success: { className: "bg-success-100 text-success-600 border-success-600/30", Icon: CheckCircle2, role: "status" },
  warning: { className: "bg-warning-100 text-warning-600 border-warning-600/30", Icon: AlertTriangle, role: "status" },
  error: { className: "bg-danger-100 text-danger-600 border-danger-600/30", Icon: XCircle, role: "alert" },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  action,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const { className: toneClass, Icon, role } = TONES[tone];
  return (
    <div
      role={role}
      className={cn("flex items-start gap-3 border px-4 py-3 text-sm leading-relaxed", toneClass, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1", "[&_a]:underline [&_a]:underline-offset-2")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
