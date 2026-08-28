import { cn } from "@/lib/utils";

type Tone = "neutral" | "blue" | "green" | "amber" | "red";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground-muted border-border-subtle",
  blue: "bg-accent-blue-soft text-accent-blue border-transparent",
  green: "bg-accent-green-soft text-accent-green border-transparent",
  amber: "bg-accent-amber-soft text-accent-amber border-transparent",
  red: "bg-accent-red-soft text-accent-red border-transparent",
};

export function Badge({
  className,
  tone = "neutral",
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotColor(tone))} />}
      {children}
    </span>
  );
}

function dotColor(tone: Tone) {
  switch (tone) {
    case "blue":
      return "bg-accent-blue";
    case "green":
      return "bg-accent-green";
    case "amber":
      return "bg-accent-amber";
    case "red":
      return "bg-accent-red";
    default:
      return "bg-foreground-muted";
  }
}
