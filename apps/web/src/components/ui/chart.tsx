import * as React from "react";

import { cn } from "../../lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color?: string;
  }
>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
}

/**
 * Conteneur neutre pour des \"charts\".
 * (Pour l'instant on s'en sert surtout comme carte stylée,
 * sans dépendance à une lib externe pour éviter de casser le build.)
 */
export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-4 text-xs shadow-sm",
          "backdrop-blur supports-[backdrop-filter]:bg-card/70",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

// Stubs pour garder l'API utilisable sans Recharts.
export function ChartTooltip() {
  return null;
}

export interface ChartTooltipContentProps {
  className?: string;
}

export function ChartTooltipContent(_props: ChartTooltipContentProps) {
  return null;
}
