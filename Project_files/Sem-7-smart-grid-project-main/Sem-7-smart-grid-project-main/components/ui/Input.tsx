import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted">{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 w-full rounded-xl border border-border-subtle bg-surface px-3.5 text-[15px] text-foreground placeholder:text-foreground-muted/70 outline-none transition-all focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10",
              icon && "pl-10",
              error && "border-accent-red focus:border-accent-red focus:ring-accent-red/10",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-accent-red">{error}</span>}
        {hint && !error && <span className="text-xs text-foreground-muted">{hint}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
