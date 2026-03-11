/** Logo Lamascott sans fond – utilisé tel quel, couleurs fixes (non impacté par dark/light mode) */
import { useMemo } from "react";

const LOGOS = [
  "/logo-1.png",
  "/logo-2.png",
  "/logo-3.png",
  "/logo-4.png",
  "/logo-5.png",
  "/logo-6.png",
  "/logo-7.png",
  "/logo-8.png",
];

export function AppLogo({ className = "h-10 w-10" }: { className?: string }) {
  const src = useMemo(() => LOGOS[Math.floor(Math.random() * LOGOS.length)], []);
  return (
    <img
      src={src}
      alt="Rh et moi by SUP des RH"
      className={`${className} logo-theme-safe`}
      width={40}
      height={40}
    />
  );
}
