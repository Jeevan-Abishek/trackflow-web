import { cn } from "@/lib/cn";
import { forwardRef, type HTMLAttributes, type InputHTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-white p-6 shadow-card", className)}
      {...props}
    />
  );
}

type BadgeTone = "live" | "ended" | "neutral" | "warn";

const badgeTones: Record<BadgeTone, string> = {
  live: "bg-live-50 text-live-600",
  ended: "bg-cloud text-ink/60",
  neutral: "bg-brand-50 text-brand-600",
  warn: "bg-amber-50 text-warn-500",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        badgeTones[tone],
        className
      )}
    >
      {tone === "live" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-live-500" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live-500" />
        </span>
      )}
      {children}
    </span>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-ink/40",
        "focus-visible:border-brand-500",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Label({ className, ...props }: HTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink/80", className)} {...props} />;
}
