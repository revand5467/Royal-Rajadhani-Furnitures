import { cn } from "@/lib/cn";
import { AVAILABILITY_SHORT, INQUIRY_STATUS, type Availability, type InquiryStatus } from "@/lib/constants";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "olive" | "muted" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-950 text-sand-50",
    accent: "bg-clay-100 text-clay-700",
    olive: "bg-olive-100 text-olive-700",
    muted: "bg-sand-200 text-ink-700",
    danger: "bg-danger-100 text-danger-600",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-[0.6875rem] font-medium tracking-[0.1em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AvailabilityBadge({ value, className }: { value: string; className?: string }) {
  const tone = value === "SOLD_OUT" ? "danger" : value === "IN_STOCK" ? "olive" : "accent";
  const label = AVAILABILITY_SHORT[value as Availability] ?? value;
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={value === "PUBLISHED" ? "neutral" : "muted"}>{value === "PUBLISHED" ? "Published" : "Draft"}</Badge>;
}

export function InquiryStatusBadge({ value }: { value: string }) {
  const tone = value === "NEW" ? "accent" : value === "READ" ? "muted" : "olive";
  const label = (INQUIRY_STATUS as readonly string[]).includes(value)
    ? value.charAt(0) + value.slice(1).toLowerCase()
    : value;
  return <Badge tone={tone}>{label}</Badge>;
}
