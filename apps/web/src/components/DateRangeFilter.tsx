"use client";

export interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  className,
}: DateRangeFilterProps) {
  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground whitespace-nowrap">Du</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          max={today()}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground whitespace-nowrap">au</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          min={dateFrom || undefined}
          max={today()}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>
      {onClear && (dateFrom || dateTo) && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
