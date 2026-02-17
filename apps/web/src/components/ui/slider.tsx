import * as React from "react";
import { cn } from "../../lib/utils";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  className,
  disabled = false,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative h-2 w-full rounded-full bg-muted">
        <div
          className="absolute h-2 rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            background:
              value === 1
                ? "#008c54"
                : value === 2
                  ? "#22c55e"
                  : value === 3
                    ? "#6b7280"
                    : value === 4
                      ? "#f97316"
                      : "#f37021",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px]">
        <span className="text-orange">Pas d&apos;accord</span>
        <span className="text-success">D&apos;accord</span>
      </div>
    </div>
  );
}
