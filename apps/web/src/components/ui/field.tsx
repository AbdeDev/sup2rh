import * as React from "react";
import { cn } from "../../lib/utils";

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-6", className)} {...props} />
  ),
);
FieldGroup.displayName = "FieldGroup";

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
  ),
);
Field.displayName = "Field";

const FieldLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  ),
);
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
FieldDescription.displayName = "FieldDescription";

const FieldSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center gap-2 py-4",
        "before:flex-1 before:border-b before:border-border",
        "after:flex-1 after:border-b after:border-border",
        className,
      )}
      {...props}
    >
      <span className="text-xs text-muted-foreground whitespace-nowrap">{children}</span>
    </div>
  ),
);
FieldSeparator.displayName = "FieldSeparator";

export { Field, FieldGroup, FieldLabel, FieldDescription, FieldSeparator };
